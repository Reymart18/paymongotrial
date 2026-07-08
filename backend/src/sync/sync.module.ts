import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FoxproModule } from '../foxpro/foxpro.module';
import { SyncController } from './sync.controller';
import { SyncRequest } from './sync-request.entity';
import { SyncService } from './sync.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SyncRequest]),
        AuthModule,
        FoxproModule,
    ],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule { }
