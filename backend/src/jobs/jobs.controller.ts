import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo tin tuyển dụng mới (UC14, BR-04)' })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  // TODO: Lấy recruiterId từ @CurrentUser() thay vì trong body
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Tìm kiếm, lọc và phân trang danh sách việc làm công khai (UC05, FR-17, FR-18, FR-19)',
  })
  findAllPublic(@Query() query: QueryJobsDto) {
    return this.jobsService.findAllPublic(query);
  }

  @Get('my-jobs')
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng của công ty thuộc recruiter hiện tại' })
  @ApiQuery({
    name: 'recruiterId',
    required: true,
    description: 'ID của recruiter (tạm thời trước khi có Auth)',
  })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  // TODO: Thay @Query bằng @CurrentUser() sau khi xong Auth
  findMyJobs(
    @Query('recruiterId', ParseUUIDPipe) recruiterId: string,
    @Query() query: QueryJobsDto,
  ) {
    return this.jobsService.findAllByRecruiter(recruiterId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết tin tuyển dụng và công ty (UC06, FR-20 - chỉ tin đã duyệt và đang mở)',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id, true);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tin tuyển dụng (UC14, BR-08)' })
  @ApiQuery({ name: 'recruiterId', required: true, description: 'ID của recruiter chỉnh sửa tin' })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  // TODO: Lấy recruiterId từ @CurrentUser()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('recruiterId', ParseUUIDPipe) recruiterId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, recruiterId, dto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Đóng tin tuyển dụng (UC15)' })
  @ApiQuery({ name: 'recruiterId', required: true, description: 'ID của recruiter đóng tin' })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('recruiterId', ParseUUIDPipe) recruiterId: string,
  ) {
    return this.jobsService.close(id, recruiterId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm tin tuyển dụng (UC14, BR-05)' })
  @ApiQuery({ name: 'recruiterId', required: true, description: 'ID của recruiter xóa tin' })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('recruiterId', ParseUUIDPipe) recruiterId: string,
  ) {
    return this.jobsService.remove(id, recruiterId);
  }
}
