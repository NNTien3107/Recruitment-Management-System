import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationEmailWorker } from './notification-email.worker';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [MailService, NotificationService, NotificationEmailWorker],
  exports: [NotificationService],
})
export class NotificationsModule {}
