import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class InterviewScheduleDto {
  @ApiProperty({ example: '2027-01-05T09:00:00+07:00' })
  @IsISO8601({ strict: true })
  @Matches(/T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/u, {
    message: 'Thời gian phỏng vấn phải có múi giờ',
  })
  scheduledAt: string;

  @ApiProperty({ example: 'Văn phòng hoặc liên kết họp', maxLength: 500 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;
}
