import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement } from './announcement.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Announcement]), AuthModule],
    providers: [AnnouncementsService],
    controllers: [AnnouncementsController],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule { }
