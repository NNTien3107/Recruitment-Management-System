import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'ID của tin tuyển dụng muốn ứng tuyển (Job ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID tin tuyển dụng phải có định dạng UUID hợp lệ' })
  jobId: string;

  @ApiProperty({
    description: 'ID file CV muốn sử dụng để ứng tuyển',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'ID CV phải có định dạng UUID hợp lệ' })
  cvId: string;

  @ApiPropertyOptional({
    description: 'Thư giới thiệu / Lời nhắn gửi đến nhà tuyển dụng',
    example: 'Tôi rất ấn tượng với công ty và có 2 năm kinh nghiệm phù hợp với vị trí này...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}

