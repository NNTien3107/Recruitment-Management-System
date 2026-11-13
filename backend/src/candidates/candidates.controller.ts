import {
  Body,
  Controller,
  Get,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CandidatesService } from './candidates.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@ApiTags('candidate')
@Controller('candidate')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Get('profile')
  @ApiOperation({ summary: 'Xem hồ sơ cá nhân của ứng viên (UC07)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID người dùng (dùng tạm khi chưa tích hợp JwtAuthGuard)',
    required: false,
  })
  async getProfile(@CurrentUser('id') userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để xem thông tin hồ sơ');
    }
    return this.candidatesService.getProfile(userId);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân của ứng viên (UC07)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID người dùng (dùng tạm khi chưa tích hợp JwtAuthGuard)',
    required: false,
  })
  async updateProfile(
    @CurrentUser('id') userId: string | undefined,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để cập nhật hồ sơ');
    }
    return this.candidatesService.updateProfile(userId, dto);
  }
}

