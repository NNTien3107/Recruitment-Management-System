import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InterviewScheduleDto } from './dto/interview-schedule.dto';
import { InterviewsService } from './interviews.service';

@ApiTags('interviews')
@Auth(Role.RECRUITER)
@Controller('recruiter/applications/:applicationId/interviews')
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem các lịch phỏng vấn của hồ sơ' })
  findAll(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser('id') recruiterId: string,
  ) {
    return this.interviews.findAll(applicationId, recruiterId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo lịch phỏng vấn' })
  create(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser('id') recruiterId: string,
    @Body() dto: InterviewScheduleDto,
  ) {
    return this.interviews.create(applicationId, recruiterId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Đổi thời gian hoặc địa điểm phỏng vấn' })
  reschedule(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') recruiterId: string,
    @Body() dto: InterviewScheduleDto,
  ) {
    return this.interviews.reschedule(applicationId, id, recruiterId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy lịch phỏng vấn' })
  cancel(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') recruiterId: string,
  ) {
    return this.interviews.cancel(applicationId, id, recruiterId);
  }
}
