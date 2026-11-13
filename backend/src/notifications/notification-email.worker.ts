import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { renderEmail } from './email-template';
import { MailService } from './mail.service';
import { readNotificationEvent } from './notifications.service';

const pollIntervalMs = 5_000;
const leaseMs = 300_000;
const retryDelayMs = [30_000, 120_000];
const maxAttempts = retryDelayMs.length + 1;

@Injectable()
export class NotificationEmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationEmailWorker.name);
  private timer?: NodeJS.Timeout;
  private active?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    if (!this.mail.enabled) return;
    this.timer = setInterval(() => {
      this.active ??= this.deliverPending()
        .catch(() => this.logger.error('Không thể xử lý hàng đợi email'))
        .finally(() => {
          this.active = undefined;
        });
    }, pollIntervalMs);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.active;
  }

  async deliverPending() {
    const pending = await this.prisma.notification.findMany({
      where: {
        emailSentAt: null,
        emailAttempts: { lt: maxAttempts },
        emailNextAttemptAt: { lte: new Date() },
      },
      select: {
        id: true,
        type: true,
        payload: true,
        emailAttempts: true,
        emailNextAttemptAt: true,
        user: { select: { email: true, fullName: true } },
      },
      orderBy: [{ emailNextAttemptAt: 'asc' }, { id: 'asc' }],
      take: 10,
    });

    for (const notification of pending) {
      const { id, type, payload, user, emailAttempts, emailNextAttemptAt } = notification;
      const leaseUntil = new Date(Date.now() + leaseMs);
      // Match the previous lease and attempt count so only one worker claims the row.
      const claim = await this.prisma.notification.updateMany({
        where: { id, emailSentAt: null, emailAttempts, emailNextAttemptAt },
        data: { emailNextAttemptAt: leaseUntil },
      });
      if (claim.count === 0) continue;

      const where = { id, emailNextAttemptAt: leaseUntil };
      try {
        const email = renderEmail(user.fullName, readNotificationEvent(type, payload));
        await this.mail.send(user.email, email.subject, email.text);
      } catch {
        const attempt = emailAttempts + 1;
        this.logger.warn(`Gửi email thất bại cho thông báo ${id} (lần ${attempt}/${maxAttempts})`);
        await this.prisma.notification.updateMany({
          where,
          data: {
            emailAttempts: attempt,
            emailNextAttemptAt:
              attempt === maxAttempts ? null : new Date(Date.now() + retryDelayMs[attempt - 1]),
          },
        });
        continue;
      }

      await this.prisma.notification.updateMany({
        where,
        data: { emailSentAt: new Date(), emailNextAttemptAt: null },
      });
    }
  }
}
