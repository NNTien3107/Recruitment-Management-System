import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobLevel, JobStatus, JobType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryJobsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tiêu đề hoặc mô tả công việc' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ description: 'Lọc theo địa điểm làm việc', example: 'Hà Nội' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: JobType, description: 'Lọc theo hình thức làm việc' })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiPropertyOptional({ enum: JobLevel, description: 'Lọc theo cấp bậc' })
  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel;

  @ApiPropertyOptional({ description: 'Lọc theo công ty cụ thể', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @ApiPropertyOptional({
    enum: JobStatus,
    description: 'Lọc theo trạng thái tin (chỉ dùng cho quản lý)',
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Lương tối thiểu từ (VND/tháng)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Lương tối đa đến (VND/tháng)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;
}
