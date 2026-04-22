import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';

@Injectable()
export class AnnouncementsService {
    constructor(
        @InjectRepository(Announcement)
        private announcementRepo: Repository<Announcement>,
    ) { }

    async getAllAnnouncements(): Promise<Announcement[]> {
        return this.announcementRepo.find({
            order: { createdAt: 'DESC' },
        });
    }

    async createAnnouncement(
        title: string,
        content: string,
        author?: string,
    ): Promise<Announcement> {
        const announcement = this.announcementRepo.create({
            title,
            content,
            author: author ?? 'Admin',
        });
        return this.announcementRepo.save(announcement);
    }

    async updateAnnouncement(
        id: number,
        title: string,
        content: string,
    ): Promise<Announcement> {
        await this.announcementRepo.update(id, {
            title,
            content,
        });
        return this.announcementRepo.findOneOrFail({ where: { id } });
    }

    async deleteAnnouncement(id: number): Promise<void> {
        await this.announcementRepo.delete(id);
    }
}
