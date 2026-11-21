import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobLevel, JobStatus, JobType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ description: 'ID của tài khoản Recruiter tạo tin', format: 'uuid' })
  @IsUUID('4', { message: 'recruiterId phải là UUID v4 hợp lệ' })
  recruiterId: string;

  @ApiProperty({
    description: 'Tiêu đề tin tuyển dụng',
    example: 'Senior Backend Engineer (NodeJS/NestJS)',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề tin tuyển dụng không được để trống' })
  @MinLength(3, { message: 'Tiêu đề tối thiểu 3 ký tự' })
  @MaxLength(200, { message: 'Tiêu đề tối đa 200 ký tự' })
  title: string;

  @ApiProperty({ description: 'Mô tả chi tiết công việc' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Mô tả công việc không được để trống' })
  @MinLength(10, { message: 'Mô tả công việc tối thiểu 10 ký tự' })
  description: string;

  @ApiPropertyOptional({ description: 'Yêu cầu ứng viên' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Quyền lợi được hưởng' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiProperty({ description: 'Địa điểm làm việc', example: 'Hà Nội' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Địa điểm làm việc không được để trống' })
  @MaxLength(255)
  location: string;

  @ApiProperty({
    description: 'Danh sách kỹ năng yêu cầu',
    example: ['NodeJS', 'NestJS', 'PostgreSQL', 'Docker'],
    type: [String],
  })
  @IsArray({ message: 'Kỹ năng phải là một mảng chuỗi' })
  @ArrayNotEmpty({ message: 'Cần có ít nhất 1 kỹ năng' })
  @IsString({ each: true, message: 'Mỗi kỹ năng phải là chuỗi ký tự' })
  skills: string[];

  @ApiPropertyOptional({
    description: 'Mức lương tối thiểu (VND/tháng, để trống = thỏa thuận)',
    example: 15000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Lương tối thiểu phải là số nguyên' })
  @Min(0, { message: 'Lương tối thiểu không được âm' })
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Mức lương tối đa (VND/tháng)', example: 35000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Lương tối đa phải là số nguyên' })
  @Min(0, { message: 'Lương tối đa không được âm' })
  salaryMax?: number;

  @ApiProperty({ enum: JobType, description: 'Hình thức làm việc', example: JobType.FULL_TIME })
  @IsEnum(JobType, { message: 'Hình thức làm việc không hợp lệ' })
  jobType: JobType;

  @ApiProperty({ enum: JobLevel, description: 'Cấp bậc công việc', example: JobLevel.SENIOR })
  @IsEnum(JobLevel, { message: 'Cấp bậc công việc không hợp lệ' })
  level: JobLevel;

  @ApiPropertyOptional({
    enum: [JobStatus.DRAFT, JobStatus.PENDING],
    description: 'Trạng thái khởi tạo (DRAFT: lưu nháp, PENDING: gửi duyệt)',
    default: JobStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus = JobStatus.DRAFT;

  @ApiPropertyOptional({ description: 'Hạn chót nộp hồ sơ ứng tuyển' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Hạn chót phải là định dạng ngày hợp lệ' })
  deadline?: Date;
}
