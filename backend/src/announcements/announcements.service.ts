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
        image?: string,
    ): Promise<Announcement> {
        const announcement = this.announcementRepo.create({
            title,
            content,
            author: author ?? 'Admin',
            image: image || null,
        });
        return this.announcementRepo.save(announcement);
    }

    async updateAnnouncement(
        id: number,
        title: string,
        content: string,
        image?: string,
    ): Promise<Announcement> {
        const updateData: any = { title, content };
        if (image) {
            updateData.image = image;
        }
        await this.announcementRepo.update(id, updateData);
        return this.announcementRepo.findOneOrFail({ where: { id } });
    }

    async deleteAnnouncement(id: number): Promise<void> {
        await this.announcementRepo.delete(id);
    }
}
