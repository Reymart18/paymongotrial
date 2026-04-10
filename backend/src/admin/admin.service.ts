import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { PropertyAccount } from '../property/property.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Admin)
        private adminRepo: Repository<Admin>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    async createAdmin(username: string, password: string, fullName: string, role: string = 'admin'): Promise<Admin> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = this.adminRepo.create({
            username,
            password: hashedPassword,
            fullName,
            role,
        });
        return this.adminRepo.save(admin);
    }

    async getAllAdmins(): Promise<Admin[]> {
        return this.adminRepo.find();
    }

    async getAdminById(id: number): Promise<Admin | null> {
        return this.adminRepo.findOne({ where: { id } });
    }

    async getAllPropertyAccounts(): Promise<PropertyAccount[]> {
        return this.propertyRepo.find();
    }

    async updatePropertyAccount(
        accountId: string,
        updates: Partial<PropertyAccount>,
    ): Promise<PropertyAccount> {
        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const allowedFields: Array<keyof PropertyAccount> = [
            'memberName',
            'propertySizeSqm',
            'classification',
            'status',
            'balance',
            'username',
        ];

        for (const field of allowedFields) {
            if (updates[field] === undefined) {
                continue;
            }

            if (field === 'propertySizeSqm' || field === 'balance') {
                const numericValue = Number(updates[field]);
                if (Number.isNaN(numericValue)) {
                    throw new BadRequestException(`Invalid ${field}`);
                }
                account[field] = numericValue as any;
                continue;
            }

            account[field] = updates[field] as any;
        }

        return this.propertyRepo.save(account);
    }

    async deletePropertyAccount(accountId: string): Promise<{ deleted: boolean }> {
        const result = await this.propertyRepo.delete({ accountId });
        if (!result.affected) {
            throw new NotFoundException('Account not found');
        }

        return { deleted: true };
    }
}
