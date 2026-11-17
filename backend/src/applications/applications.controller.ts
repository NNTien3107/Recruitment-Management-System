import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Post()
  @ApiOperation({ summary: 'Nộp đơn ứng tuyển vào tin tuyển dụng (UC09)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên (dùng tạm khi chưa có JwtAuthGuard)',
    required: false,
  })
  async apply(
    @CurrentUser('id') candidateId: string | undefined,
    @Body() dto: CreateApplicationDto,
  ) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để nộp đơn ứng tuyển');
    }
    return this.applicationsService.apply(candidateId, dto);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Get('my-history')
  @ApiOperation({ summary: 'Xem lịch sử danh sách các vị trí đã ứng tuyển (UC10)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên',
    required: false,
  })
  async getMyApplications(
    @CurrentUser('id') candidateId: string | undefined,
    @Query() query: QueryApplicationsDto,
  ) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để xem lịch sử ứng tuyển');
    }
    return this.applicationsService.getMyApplications(candidateId, query);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn ứng tuyển và dòng thời gian xử lý (UC10)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên',
    required: false,
  })
  async getMyApplicationDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') candidateId?: string,
  ) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    return this.applicationsService.getMyApplicationDetail(id, candidateId);
  }
}
