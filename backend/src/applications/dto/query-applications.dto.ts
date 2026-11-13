import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryApplicationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc danh sách theo trạng thái ứng tuyển',
    enum: ApplicationStatus,
    example: ApplicationStatus.APPLIED,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (theo tiêu đề việc làm hoặc tên/email ứng viên)',
    example: 'NodeJS',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

