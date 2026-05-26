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

    async getAllAnnouncements(role: string, target?: string): Promise<Announcement[]> {
        const normalizedRole = String(role || '').toLowerCase();
        const normalizedTarget = String(target || '').toLowerCase();
        const isStaff = normalizedRole === 'admin' || normalizedRole === 'super_admin';

        const query = this.announcementRepo
            .createQueryBuilder('announcement')
            .orderBy('announcement.createdAt', 'DESC');

        if (isStaff && normalizedTarget === 'bod') {
            query.where('announcement.target = :target', { target: 'bod' });
        } else if (isStaff && normalizedTarget === 'all') {
            query.where('announcement.target = :target', { target: 'all' });
        } else if (!isStaff) {
            query.where('announcement.target != :target', { target: 'bod' });
        }

        return query.getMany();
    }

    async createAnnouncement(
        title: string,
        content: string,
        author?: string,
        image?: string,
        target?: string,
    ): Promise<Announcement> {
        const announcement = this.announcementRepo.create({
            title,
            content,
            author: author ?? 'Admin',
            image: image || null,
            target: target || 'all',
        });
        return this.announcementRepo.save(announcement);
    }

    async updateAnnouncement(
        id: number,
        title: string,
        content: string,
        image?: string,
        target?: string,
    ): Promise<Announcement> {
        const updateData: any = { title, content };
        if (image) {
            updateData.image = image;
        }
        if (target) {
            updateData.target = target;
        }
        await this.announcementRepo.update(id, updateData);
        return this.announcementRepo.findOneOrFail({ where: { id } });
    }

    async deleteAnnouncement(id: number): Promise<void> {
        await this.announcementRepo.delete(id);
    }
}
