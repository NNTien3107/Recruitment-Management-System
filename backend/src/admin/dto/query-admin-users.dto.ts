import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryAdminUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: Role,
    description: 'Lọc theo vai trò người dùng (CANDIDATE, RECRUITER, ADMIN)',
    example: Role.CANDIDATE,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Lọc theo trạng thái khóa tài khoản (true: đã khóa, false: đang hoạt động)',
    example: false,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo email hoặc họ tên người dùng' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
