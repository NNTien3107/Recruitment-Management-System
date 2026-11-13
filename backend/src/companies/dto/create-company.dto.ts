import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'ID của tài khoản Recruiter sở hữu công ty', format: 'uuid' })
  @IsUUID('4', { message: 'ownerId phải là UUID v4 hợp lệ' })
  ownerId: string;

  @ApiProperty({ description: 'Tên công ty', maxLength: 200, example: 'Tech Corp Vietnam' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  @MinLength(2, { message: 'Tên công ty phải có ít nhất 2 ký tự' })
  @MaxLength(200, { message: 'Tên công ty tối đa 200 ký tự' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả tóm tắt về công ty', maxLength: 2000 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Mô tả công ty tối đa 2000 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Website chính thức của công ty',
    example: 'https://example.com',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl({}, { message: 'Website phải là một URL hợp lệ' })
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'URL logo công ty (từ StorageService)' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ trụ sở công ty', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Ngành nghề hoạt động',
    maxLength: 100,
    example: 'Công nghệ thông tin',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({
    description: 'Quy mô công ty',
    maxLength: 50,
    example: '50-100 nhân viên',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;
}
