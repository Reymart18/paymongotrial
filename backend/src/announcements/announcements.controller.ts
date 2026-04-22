import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './announcement.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: number;
        username: string;
        role: string;
    };
}

@Controller('announcements')
export class AnnouncementsController {
    constructor(private announcementsService: AnnouncementsService) { }

    @Get()
    async getAllAnnouncements(): Promise<Announcement[]> {
        return this.announcementsService.getAllAnnouncements();
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createAnnouncement(
        @Body() body: { title: string; content: string },
        @Request() req: AuthenticatedRequest,
    ): Promise<Announcement> {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can create announcements');
        }

        return this.announcementsService.createAnnouncement(
            body.title,
            body.content,
            req.user.username,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updateAnnouncement(
        @Param('id') id: string,
        @Body() body: { title: string; content: string },
        @Request() req: AuthenticatedRequest,
    ): Promise<Announcement> {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can edit announcements');
        }

        return this.announcementsService.updateAnnouncement(
            parseInt(id),
            body.title,
            body.content,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteAnnouncement(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<{ message: string }> {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can delete announcements');
        }

        await this.announcementsService.deleteAnnouncement(parseInt(id));
        return { message: 'Announcement deleted successfully' };
    }
}
