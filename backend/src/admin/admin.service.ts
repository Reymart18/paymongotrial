import { Injectable } from '@nestjs/common';
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
}
