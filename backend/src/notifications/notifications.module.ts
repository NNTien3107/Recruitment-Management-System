import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationEmailWorker } from './notification-email.worker';
import { NotificationService } from './notifications.service';

@Module({
  providers: [MailService, NotificationService, NotificationEmailWorker],
  exports: [NotificationService],
})
export class NotificationsModule {}
