import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới cần chuyển đổi cho đơn ứng tuyển',
    enum: ApplicationStatus,
    example: ApplicationStatus.REVIEWING,
  })
  @IsEnum(ApplicationStatus, { message: 'Trạng thái ứng tuyển không hợp lệ' })
  status: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Ghi chú hoặc lý do thay đổi trạng thái (được lưu vào lịch sử)',
    example: 'Hồ sơ đạt yêu cầu chuyên môn, chuyển sang bước phỏng vấn vòng 1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

