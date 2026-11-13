import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ExperienceItemDto {
  @ApiPropertyOptional({ example: 'Công ty Công nghệ ABC' })
  @IsString()
  company: string;

  @ApiPropertyOptional({ example: 'Frontend Developer' })
  @IsString()
  position: string;

  @ApiPropertyOptional({ example: '01/2024' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ example: 'Hiện tại' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Phát triển giao diện ứng dụng quản lý với React' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class EducationItemDto {
  @ApiPropertyOptional({ example: 'Đại học Bách Khoa' })
  @IsString()
  school: string;

  @ApiPropertyOptional({ example: 'Cử nhân' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ example: '2020' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateCandidateProfileDto {
  @ApiPropertyOptional({ description: 'Họ và tên ứng viên', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ', example: '0987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ nơi ở', example: 'Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Chức danh / vị trí nghề nghiệp mong muốn',
    example: 'Backend NodeJS Developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: 'Giới thiệu ngắn về bản thân',
    example: 'Lập trình viên đam mê kiến trúc backend, có kinh nghiệm với NestJS và PostgreSQL',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Danh sách kỹ năng chuyên môn',
    example: ['NestJS', 'TypeScript', 'PostgreSQL', 'Docker'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Lịch sử kinh nghiệm làm việc',
    type: [ExperienceItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experience?: ExperienceItemDto[];

  @ApiPropertyOptional({
    description: 'Quá trình học vấn',
    type: [EducationItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education?: EducationItemDto[];

  @ApiPropertyOptional({
    description: 'Ảnh đại diện (URL)',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

