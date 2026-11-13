import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('recruiter-applications')
@Controller('recruiter')
export class RecruiterApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  @Get('jobs/:jobId/applications')
  @ApiOperation({
    summary: 'Danh sách ứng viên nộp đơn theo từng tin tuyển dụng (UC16)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID nhà tuyển dụng (Recruiter ID)',
    required: false,
  })
  async getJobApplications(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser('id') recruiterId: string | undefined,
    @Query() query: QueryApplicationsDto,
  ) {
    if (!recruiterId) {
      throw new UnauthorizedException('Vui lòng đăng nhập với tư cách Nhà tuyển dụng');
    }
    return this.applicationsService.getJobApplicationsForRecruiter(
      jobId,
      recruiterId,
      query,
    );
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  @Get('applications/:id')
  @ApiOperation({
    summary: 'Xem chi tiết hồ sơ ứng viên và thông tin nộp đơn (UC17)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID nhà tuyển dụng',
    required: false,
  })
  async getApplicationDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') recruiterId?: string,
  ) {
    if (!recruiterId) {
      throw new UnauthorizedException('Vui lòng đăng nhập với tư cách Nhà tuyển dụng');
    }
    return this.applicationsService.getApplicationDetailForRecruiter(id, recruiterId);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  @Get('applications/:id/cv')
  @ApiOperation({
    summary: 'Tải xuống file CV của ứng viên nộp cho tin tuyển dụng (UC17)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID nhà tuyển dụng',
    required: false,
  })
  async downloadApplicantCv(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') recruiterId: string | undefined,
    @Res() res: Response,
  ) {
    if (!recruiterId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }

    const { cv, storedFile } = await this.applicationsService.downloadApplicantCv(
      id,
      recruiterId,
    );

    const safeFilename = encodeURIComponent(cv.originalName);
    res.setHeader('Content-Type', cv.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
    );

    storedFile.stream.pipe(res);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  @Patch('applications/:id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái đơn ứng tuyển (qua canTransition) (UC18)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID nhà tuyển dụng',
    required: false,
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') recruiterId: string | undefined,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    if (!recruiterId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    return this.applicationsService.updateStatus(id, recruiterId, dto);
  }
}

