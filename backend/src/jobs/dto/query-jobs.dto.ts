import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobLevel, JobStatus, JobType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum JobSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  SALARY_DESC = 'salary_desc',
  SALARY_ASC = 'salary_asc',
}

export class QueryJobsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tiêu đề hoặc mô tả công việc' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({
    description:
      'Lọc theo danh sách kỹ năng (truyền mảng hoặc chuỗi cách nhau bởi dấu phẩy, vd: NodeJS,NestJS)',
    type: [String],
    example: ['NodeJS', 'NestJS'],
  })
  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsOptional()
  @IsArray({ message: 'skills phải là danh sách kỹ năng hợp lệ' })
  @IsString({ each: true, message: 'Mỗi kỹ năng phải là một chuỗi ký tự' })
  skills?: string[];

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

  @ApiPropertyOptional({
    enum: JobSort,
    description:
      'Sắp xếp kết quả: newest (mới nhất), oldest (cũ nhất), salary_desc (lương cao -> thấp), salary_asc (lương thấp -> cao)',
    default: JobSort.NEWEST,
  })
  @IsOptional()
  @IsEnum(JobSort)
  sort?: JobSort = JobSort.NEWEST;
}
