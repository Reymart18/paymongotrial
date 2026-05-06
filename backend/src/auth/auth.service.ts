import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admin/admin.entity';
import { PropertyAccount } from '../property/property.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Admin)
        private adminRepo: Repository<Admin>,
        @InjectRepository(PropertyAccount)
        private propertyAccountRepo: Repository<PropertyAccount>,
        private jwtService: JwtService,
    ) { }

    /**
     * Validates admin credentials
     * @param username Admin username
     * @param password Admin password (plain text)
     * @returns Admin object without password, or null if invalid
     */
    async validateAdmin(username: string, password: string): Promise<any> {
        const admin = await this.adminRepo.findOne({ where: { username } });
        if (admin && admin.password && (await bcrypt.compare(password, admin.password))) {
            const { password, ...result } = admin;
            return result;
        }
        return null;
    }

    /**
     * Generates JWT token for admin login
     * @param admin Admin entity
     * @returns Object with access_token
     */
    async login(admin: Admin) {
        const payload = { username: admin.username, sub: admin.id, role: admin.role };
        return {
            access_token: this.jwtService.sign(payload),
            role: admin.role ?? 'admin',
        };
    }

    /**
     * Validates homeowner credentials
     * @param accountId Property account ID
     * @param password Homeowner password (plain text)
     * @returns PropertyAccount object without password, or null if invalid
     */
    async validateHomeowner(accountId: string, password: string): Promise<any> {
        const homeowner = await this.propertyAccountRepo.findOne({ where: { accountId } });
        if (homeowner && homeowner.password && (await bcrypt.compare(password, homeowner.password))) {
            const { password, ...result } = homeowner;
            return result;
        }
        return null;
    }

    /**
     * Generates JWT token for homeowner login
     * @param homeowner PropertyAccount entity
     * @returns Object with access_token
     */
    async loginHomeowner(homeowner: PropertyAccount) {
        const payload = { username: homeowner.username, sub: homeowner.id, role: 'homeowner' };
        return {
            access_token: this.jwtService.sign(payload),
            requirePasswordChange: !homeowner.passwordChanged,
            accountId: homeowner.accountId,
        };
    }
}