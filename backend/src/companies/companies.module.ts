import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService], // Cho phép JobsModule dùng để kiểm tra điều kiện đăng tin (BR-04)
})
export class CompaniesModule {}
