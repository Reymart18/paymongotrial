import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyAccount } from '../property/property.entity';
import { ServiceRequest } from './service-request.entity';
import { ServiceComplaint } from './service-complaint.entity';

export interface CreateServiceRequestInput {
  requestType: string;
  subject: string;
  description: string;
  preferredDate: string;
}

export interface CreateServiceComplaintInput {
  complaintType: string;
  subject: string;
  description: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
}

const REQUEST_TYPES = [
  'Gate Pass',
  'Move-in/Move-out Permit',
  'Maintenance Request',
  'Visitor Pass',
  'Other',
];

const COMPLAINT_TYPES = [
  'Noise Complaint',
  'Parking Violation',
  'Pet Violation',
  'Security Concern',
  'Property Damage',
  'Other',
];

const REQUEST_STATUSES = ['Under Review', 'Accepted', 'Rejected'];
const COMPLAINT_STATUSES = ['Under Review', 'Resolved'];
const MAX_ADMIN_REPLY_LENGTH = 2000;

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepo: Repository<ServiceRequest>,
    @InjectRepository(ServiceComplaint)
    private serviceComplaintRepo: Repository<ServiceComplaint>,
    @InjectRepository(PropertyAccount)
    private propertyRepo: Repository<PropertyAccount>,
  ) {}

  async createForHomeowner(
    homeownerId: number,
    input: CreateServiceRequestInput,
  ) {
    const account = await this.propertyRepo.findOne({
      where: { id: homeownerId },
    });
    if (!account?.accountId) {
      throw new NotFoundException('Property account not found');
    }

    const requestType = String(input?.requestType || '').trim();
    const subject = String(input?.subject || '').trim();
    const description = String(input?.description || '').trim();
    const preferredDate = String(input?.preferredDate || '').trim();

    if (!REQUEST_TYPES.includes(requestType)) {
      throw new BadRequestException('Invalid request type');
    }
    if (!subject || !description || !preferredDate) {
      throw new BadRequestException('All request fields are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      throw new BadRequestException('Preferred date is invalid');
    }
    const preferredDateValue = new Date(`${preferredDate}T00:00:00`);
    if (Number.isNaN(preferredDateValue.getTime())) {
      throw new BadRequestException('Preferred date is invalid');
    }

    const request = this.serviceRequestRepo.create({
      accountId: account.accountId,
      requestType,
      subject,
      description,
      preferredDate: preferredDateValue,
      status: 'Under Review',
    });

    const savedRequest = await this.serviceRequestRepo.save(request);

    return {
      ...savedRequest,
      memberName: account.memberName,
    };
  }

  async getForHomeowner(homeownerId: number) {
    const account = await this.propertyRepo.findOne({
      where: { id: homeownerId },
    });
    if (!account?.accountId) {
      throw new NotFoundException('Property account not found');
    }

    const requests = await this.serviceRequestRepo.find({
      where: { accountId: account.accountId },
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => ({
      ...request,
      memberName: account.memberName,
    }));
  }

  async createComplaintForHomeowner(
    homeownerId: number,
    input: CreateServiceComplaintInput,
    evidence?: Express.Multer.File,
  ) {
    const account = await this.propertyRepo.findOne({
      where: { id: homeownerId },
    });
    if (!account?.accountId) {
      throw new NotFoundException('Property account not found');
    }

    const complaintType = String(input?.complaintType || '').trim();
    const subject = String(input?.subject || '').trim();
    const description = String(input?.description || '').trim();
    const incidentDate = String(input?.incidentDate || '').trim();
    const incidentTime = String(input?.incidentTime || '').trim();
    const location = String(input?.location || '').trim();

    if (!COMPLAINT_TYPES.includes(complaintType)) {
      throw new BadRequestException('Invalid complaint type');
    }
    if (
      !subject ||
      !description ||
      !incidentDate ||
      !incidentTime ||
      !location
    ) {
      throw new BadRequestException('All complaint fields are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) {
      throw new BadRequestException('Incident date is invalid');
    }
    if (!/^\d{2}:\d{2}$/.test(incidentTime)) {
      throw new BadRequestException('Incident time is invalid');
    }

    const incidentDateValue = new Date(`${incidentDate}T00:00:00`);
    if (Number.isNaN(incidentDateValue.getTime())) {
      throw new BadRequestException('Incident date is invalid');
    }

    const complaint = this.serviceComplaintRepo.create({
      accountId: account.accountId,
      complaintType,
      subject,
      description,
      incidentDate: incidentDateValue,
      incidentTime,
      location,
      evidenceAttachment: evidence?.filename || null,
      evidenceOriginalName: evidence?.originalname || null,
      status: 'Under Review',
    });

    const savedComplaint = await this.serviceComplaintRepo.save(complaint);

    return {
      ...savedComplaint,
      memberName: account.memberName,
    };
  }

  async getComplaintsForHomeowner(homeownerId: number) {
    const account = await this.propertyRepo.findOne({
      where: { id: homeownerId },
    });
    if (!account?.accountId) {
      throw new NotFoundException('Property account not found');
    }

    const complaints = await this.serviceComplaintRepo.find({
      where: { accountId: account.accountId },
      order: { createdAt: 'DESC' },
    });

    return complaints.map((complaint) => ({
      ...complaint,
      memberName: account.memberName,
    }));
  }

  async getAllForAdmin() {
    const requests = await this.serviceRequestRepo.find({
      relations: { account: true },
      order: { createdAt: 'DESC' },
    });

    return requests.map(({ account, ...request }) => ({
      ...request,
      account: account
        ? {
            accountId: account.accountId,
            memberName: account.memberName,
            neighborhood: account.neighborhood,
            block: account.block,
            lot: account.lot,
          }
        : null,
    }));
  }

  async getAllComplaintsForAdmin() {
    const complaints = await this.serviceComplaintRepo.find({
      relations: { account: true },
      order: { createdAt: 'DESC' },
    });

    return complaints.map(({ account, ...complaint }) => ({
      ...complaint,
      account: account
        ? {
            accountId: account.accountId,
            memberName: account.memberName,
            neighborhood: account.neighborhood,
            block: account.block,
            lot: account.lot,
          }
        : null,
    }));
  }

  async updateRequestStatus(id: number, status: string, adminReply?: string) {
    const normalizedStatus = String(status || '').trim();
    if (!REQUEST_STATUSES.includes(normalizedStatus)) {
      throw new BadRequestException('Invalid request status');
    }

    const request = await this.serviceRequestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    request.status = normalizedStatus;
    this.applyAdminReply(request, adminReply);
    return this.serviceRequestRepo.save(request);
  }

  async updateComplaintStatus(id: number, status: string, adminReply?: string) {
    const normalizedStatus = String(status || '').trim();
    if (!COMPLAINT_STATUSES.includes(normalizedStatus)) {
      throw new BadRequestException('Invalid complaint status');
    }

    const complaint = await this.serviceComplaintRepo.findOne({
      where: { id },
    });
    if (!complaint) {
      throw new NotFoundException('Service complaint not found');
    }

    complaint.status = normalizedStatus;
    this.applyAdminReply(complaint, adminReply);
    return this.serviceComplaintRepo.save(complaint);
  }

  private applyAdminReply(
    submission: { adminReply?: string | null; adminReplyAt?: Date | null },
    adminReply?: string,
  ) {
    if (adminReply === undefined) {
      return;
    }

    const normalizedReply = String(adminReply || '').trim();
    if (normalizedReply.length > MAX_ADMIN_REPLY_LENGTH) {
      throw new BadRequestException('Reply message must be 2000 characters or less');
    }

    const previousReply = submission.adminReply || '';
    submission.adminReply = normalizedReply || null;
    submission.adminReplyAt = normalizedReply && normalizedReply !== previousReply
      ? new Date()
      : submission.adminReplyAt || null;
  }
}
