import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { OnlinePayment } from './online-payment.entity';

interface CheckoutResponse {
    data?: {
        id?: string;
        attributes?: {
            checkout_url?: string;
        };
    };
}

@Injectable()
export class PaymongoService {
    constructor(
        @InjectRepository(OnlinePayment)
        private readonly onlinePaymentRepo: Repository<OnlinePayment>,
    ) { }

    async createCheckoutSession(accountId: string, memberName: string, amount: number) {
        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (!secretKey) {
            throw new InternalServerErrorException('PayMongo is not configured');
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const response = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        billing: {
                            name: memberName,
                        },
                        cancel_url: `${frontendUrl}/soa-preview/${accountId}`,
                        description: `PVHAI SOA payment for ${accountId}`,
                        line_items: [
                            {
                                amount: Math.round(amount * 100),
                                currency: 'PHP',
                                description: `Amount due for ${accountId}`,
                                name: 'PVHAI homeowners association dues',
                                quantity: 1,
                            },
                        ],
                        metadata: {
                            accountId,
                        },
                        pass_on_fees: true,
                        payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya', 'qrph'],
                        send_email_receipt: false,
                        show_description: true,
                        success_url: `${frontendUrl}/soa-preview/${accountId}?payment=success`,
                    },
                },
            }),
        });

        const result = await response.json() as CheckoutResponse & { errors?: Array<{ detail?: string }> };
        if (!response.ok) {
            const message = result.errors?.[0]?.detail || 'PayMongo checkout creation failed';
            throw new BadRequestException(message);
        }

        const checkoutUrl = result.data?.attributes?.checkout_url;
        if (!checkoutUrl) {
            throw new InternalServerErrorException('PayMongo did not return a checkout URL');
        }

        const checkoutSessionId = result.data?.id;
        if (!checkoutSessionId) {
            throw new InternalServerErrorException('PayMongo did not return a checkout session ID');
        }

        const onlinePayment = await this.onlinePaymentRepo.save({
            accountId,
            memberName,
            amount,
            status: 'UNDER_REVIEW',
            paymongoCheckoutSessionId: checkoutSessionId,
            postedToFoxpro: false,
        });
        onlinePayment.paymongoReference = this.createOnlineReference(
            accountId,
            onlinePayment.id as number,
        );
        await this.onlinePaymentRepo.save(onlinePayment);

        return {
            checkoutUrl,
            checkoutSessionId,
        };
    }

    async handleWebhook(payload: unknown, signature: string | undefined, rawBody: Buffer) {
        this.verifyWebhookSignature(signature, rawBody);

        const event = this.getRecord(payload);
        const eventType = String(event?.attributes?.type || '');
        if (eventType !== 'checkout_session.payment.paid') {
            return { received: true, handled: false };
        }

        const checkoutSession = event?.attributes?.data;
        const checkoutSessionId = checkoutSession?.id;
        if (!checkoutSessionId) {
            throw new BadRequestException('PayMongo webhook has no checkout session ID');
        }

        const checkoutAttributes = checkoutSession?.attributes || {};
        const payment = checkoutAttributes.payment
            || checkoutAttributes.payments?.[0]
            || null;
        const paymentAttributes = payment?.attributes || {};
        const paidAt = this.toDate(event?.attributes?.created_at)
            || new Date();
        let existing = await this.onlinePaymentRepo.findOne({
            where: { paymongoCheckoutSessionId: checkoutSessionId },
        });

        if (!existing) {
            return { received: true, handled: false };
        }

        existing.status = 'UNDER_REVIEW';
        existing.paymongoPaymentId = payment?.id || existing.paymongoPaymentId;
        existing.paymongoReference = existing.paymongoReference
            || paymentAttributes.reference_number
            || payment?.id
            || null;
        existing.paymentMethod = paymentAttributes.source?.type
            || paymentAttributes.payment_method_details?.type
            || existing.paymentMethod
            || null;
        existing.paidAt = paidAt;
        await this.onlinePaymentRepo.save(existing);

        return { received: true, handled: true, status: existing.status };
    }

    private verifyWebhookSignature(signature: string | undefined, rawBody: Buffer) {
        const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
        if (!webhookSecret || !signature || !rawBody) {
            throw new UnauthorizedException('PayMongo webhook signature is not configured');
        }

        const parts = signature.split(',').reduce<Record<string, string>>((result, part) => {
            const [key, value] = part.split('=', 2);
            if (key && value) {
                result[key.trim()] = value.trim();
            }
            return result;
        }, {});
        const signedPayload = `${parts.t}.${rawBody.toString('utf8')}`;
        const expected = createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');
        const provided = [parts.te, parts.li].filter(Boolean);

        const valid = provided.some((candidate) => {
            const expectedBuffer = Buffer.from(expected, 'utf8');
            const candidateBuffer = Buffer.from(candidate, 'utf8');
            return expectedBuffer.length === candidateBuffer.length
                && timingSafeEqual(expectedBuffer, candidateBuffer);
        });

        if (!valid) {
            throw new UnauthorizedException('Invalid PayMongo webhook signature');
        }
    }

    private getRecord(payload: unknown): {
        attributes?: {
            type?: string;
            created_at?: number;
            data?: {
                id?: string;
                attributes?: {
                    billing?: { name?: string };
                    line_items?: Array<{ amount?: number }>;
                    metadata?: { accountId?: string };
                    payment?: { id?: string; attributes?: Record<string, any> };
                    payments?: Array<{ id?: string; attributes?: Record<string, any> }>;
                };
            };
        };
    } {
        const record = (payload as { data?: unknown })?.data;
        if (!record || typeof record !== 'object') {
            throw new BadRequestException('Invalid PayMongo webhook payload');
        }
        return record as ReturnType<PaymongoService['getRecord']>;
    }

    private toDate(value: unknown): Date | null {
        if (typeof value !== 'number') {
            return null;
        }
        const date = new Date(value * 1000);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    private createOnlineReference(accountId: string, id: number): string {
        const date = new Date();
        const datePart = date.toISOString().slice(0, 10).replaceAll('-', '');
        return `ONLINE-${datePart}-${accountId}-${String(id).padStart(5, '0')}`;
    }
}
