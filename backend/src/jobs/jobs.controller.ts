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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Auth(Role.RECRUITER)
  @ApiOperation({ summary: 'Tạo tin tuyển dụng mới (UC14, BR-04)' })
  create(@CurrentUser('id') recruiterId: string, @Body() dto: CreateJobDto) {
    return this.jobsService.create({ ...dto, recruiterId });
  }

  @Get()
  @ApiOperation({
    summary: 'Tìm kiếm, lọc và phân trang danh sách việc làm công khai (UC05, FR-17, FR-18, FR-19)',
  })
  findAllPublic(@Query() query: QueryJobsDto) {
    return this.jobsService.findAllPublic(query);
  }

  @Get('my-jobs')
  @Auth(Role.RECRUITER)
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng của công ty thuộc recruiter hiện tại' })
  findMyJobs(@CurrentUser('id') recruiterId: string, @Query() query: QueryJobsDto) {
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
  @Auth(Role.RECRUITER)
  @ApiOperation({ summary: 'Cập nhật tin tuyển dụng (UC14, BR-08)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') recruiterId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, recruiterId, dto);
  }

  @Patch(':id/close')
  @Auth(Role.RECRUITER)
  @ApiOperation({ summary: 'Đóng tin tuyển dụng (UC15)' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') recruiterId: string) {
    return this.jobsService.close(id, recruiterId);
  }

  @Delete(':id')
  @Auth(Role.RECRUITER)
  @ApiOperation({ summary: 'Xóa mềm tin tuyển dụng (UC14, BR-05)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') recruiterId: string) {
    return this.jobsService.remove(id, recruiterId);
  }
}
