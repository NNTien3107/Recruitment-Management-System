import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCvDto {
  @ApiPropertyOptional({
    description: 'Tên gợi nhớ của CV',
    example: 'CV Chuyên viên Backend Fresher',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Đặt làm CV mặc định',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

