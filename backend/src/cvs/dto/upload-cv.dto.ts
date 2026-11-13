import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadCvDto {
  @ApiPropertyOptional({
    description: 'Tên đặt cho CV (ví dụ: CV Backend 2026). Nếu bỏ trống sẽ lấy tên file gốc.',
    example: 'CV Lập trình viên NodeJS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Đặt CV này làm CV mặc định để tự động chọn khi ứng tuyển',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isDefault?: boolean;
}

