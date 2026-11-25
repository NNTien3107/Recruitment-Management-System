import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { RejectJobDto } from './dto/reject-job.dto';

@ApiTags('admin')
@Controller('admin')
// TODO: @UseGuards(JwtAuthGuard, RolesGuard)
// TODO: @Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({
    summary:
      'Danh sách người dùng dành cho Admin quản lý (lọc theo vai trò, trạng thái khóa, từ khóa - UC21, FR-31)',
  })
  findAllUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminService.findAllUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Xem chi tiết người dùng dành cho Admin (UC21, FR-31)' })
  findUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findUserById(id);
  }

  @Patch('users/:id/lock')
  @ApiOperation({
    summary: 'Khóa tài khoản người dùng và thu hồi toàn bộ refresh token (UC22, FR-32, BR-06)',
  })
  lockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.lockUser(id);
  }

  @Patch('users/:id/unlock')
  @ApiOperation({ summary: 'Mở khóa tài khoản người dùng (UC22, FR-32)' })
  unlockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unlockUser(id);
  }

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
