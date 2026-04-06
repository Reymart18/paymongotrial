import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PropertyAccount } from './property.entity';

export interface CreateHomeownerInput {
    neighborhood: string;
    block: string;
    lot: string;
    memberName: string;
    propertySizeSqm: number;
    classification: string;
    ownerType: string;
    username: string;
    password: string;
}

@Injectable()
export class PropertyService {
    constructor(
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    async createHomeowner(input: CreateHomeownerInput): Promise<PropertyAccount> {
        const accountId = `${input.neighborhood}${input.block}${input.lot}`;
        const hashedPassword = await bcrypt.hash(input.password, 10);

        const homeowner = this.propertyRepo.create({
            accountId,
            neighborhood: input.neighborhood,
            block: input.block,
            lot: input.lot,
            memberName: input.memberName,
            propertySizeSqm: input.propertySizeSqm,
            classification: input.classification,
            ownerType: input.ownerType,
            username: input.username,
            password: hashedPassword,
            balance: 0,
            status: 'active',
        });

        return this.propertyRepo.save(homeowner);
    }

    async getByAccountId(accountId: string): Promise<PropertyAccount | null> {
        return this.propertyRepo.findOne({ where: { accountId } });
    }
}
