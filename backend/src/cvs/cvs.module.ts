import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';

@Module({
  controllers: [CvsController],
  providers: [CvsService, JwtAuthGuard],
  exports: [CvsService],
})
export class CvsModule {}
