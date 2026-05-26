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
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllAnnouncements(
        @Query('target') target: string | undefined,
        @Request() req: AuthenticatedRequest,
    ): Promise<Announcement[]> {
        return this.announcementsService.getAllAnnouncements(req.user.role, target);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: 'uploads/announcements',
                filename: (_req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
                    file.mimetype,
                );

                if (!allowed) {
                    return cb(new BadRequestException('Only image files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async createAnnouncement(
        @Body() body: { title: string; content: string; target?: string },
        @UploadedFile() file: Express.Multer.File | undefined,
        @Request() req: AuthenticatedRequest,
    ): Promise<Announcement> {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admin can create announcements');
        }

        return this.announcementsService.createAnnouncement(
            body.title,
            body.content,
            req.user.username,
            file?.filename,
            body.target,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: 'uploads/announcements',
                filename: (_req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
                    file.mimetype,
                );

                if (!allowed) {
                    return cb(new BadRequestException('Only image files are allowed'), false);
                }

                return cb(null, true);
            },
        }),
    )
    async updateAnnouncement(
        @Param('id') id: string,
        @Body() body: { title: string; content: string; target?: string },
        @UploadedFile() file: Express.Multer.File | undefined,
        @Request() req: AuthenticatedRequest,
    ): Promise<Announcement> {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admin can edit announcements');
        }

        return this.announcementsService.updateAnnouncement(
            parseInt(id),
            body.title,
            body.content,
            file?.filename,
            body.target,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteAnnouncement(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<{ message: string }> {
        if (req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only super admin can delete announcements');
        }

        await this.announcementsService.deleteAnnouncement(parseInt(id));
        return { message: 'Announcement deleted successfully' };
    }
}
