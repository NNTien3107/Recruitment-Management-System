import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CandidatesService } from './candidates.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@ApiTags('candidate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('candidate')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  private getCandidateId(user: RequestUser | undefined): string {
    if (!user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }

    if (user.role !== Role.CANDIDATE) {
      throw new ForbiddenException('Chỉ ứng viên mới được thực hiện thao tác này');
    }

    return user.id;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Xem hồ sơ cá nhân của ứng viên (UC07)' })
  async getProfile(@CurrentUser() user: RequestUser | undefined) {
    const userId = this.getCandidateId(user);
    return this.candidatesService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân của ứng viên (UC07)' })
  async updateProfile(
    @CurrentUser() user: RequestUser | undefined,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    const userId = this.getCandidateId(user);
    return this.candidatesService.updateProfile(userId, dto);
  }
}
