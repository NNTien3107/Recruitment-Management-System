import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, JwtAuthGuard],
  exports: [CandidatesService],
})
export class CandidatesModule {}
