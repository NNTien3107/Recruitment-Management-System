import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { RecruiterApplicationsController } from './recruiter-applications.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [ApplicationsController, RecruiterApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
