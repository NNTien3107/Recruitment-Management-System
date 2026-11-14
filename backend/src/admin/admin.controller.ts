import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { RejectJobDto } from './dto/reject-job.dto';

@ApiTags('admin')
@Controller('admin')
// TODO: @UseGuards(JwtAuthGuard, RolesGuard)
// TODO: @Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('jobs')
  @ApiOperation({
    summary: 'Danh sách tin tuyển dụng dành cho Admin kiểm duyệt (lọc theo trạng thái, từ khóa)',
  })
  findAllJobs(@Query() query: QueryAdminJobsDto) {
    return this.adminService.findAllJobs(query);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Xem chi tiết tin tuyển dụng dành cho Admin thẩm định' })
  findJobById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findJobById(id);
  }

  @Patch('jobs/:id/approve')
  @ApiOperation({ summary: 'Duyệt tin tuyển dụng đang ở trạng thái PENDING (UC23, FR-33)' })
  approveJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveJob(id);
  }

  @Patch('jobs/:id/reject')
  @ApiOperation({
    summary: 'Từ chối tin tuyển dụng đang ở trạng thái PENDING kèm lý do (UC23, FR-33)',
  })
  rejectJob(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectJobDto) {
    return this.adminService.rejectJob(id, dto);
  }
}
