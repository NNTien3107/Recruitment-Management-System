import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryAdminJobsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: JobStatus,
    description: 'Lọc theo trạng thái tin tuyển dụng (vd: PENDING để xem tin chờ duyệt)',
    example: JobStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Lọc theo ID công ty', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề tin hoặc tên công ty' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
