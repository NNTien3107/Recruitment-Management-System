import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { RecruiterApplicationsController } from './recruiter-applications.controller';

@Module({
  controllers: [ApplicationsController, RecruiterApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

