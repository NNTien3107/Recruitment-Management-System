import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectJobDto {
  @ApiProperty({
    description: 'Lý do từ chối tin tuyển dụng (UC23, FR-33)',
    example: 'Nội dung mô tả công việc chưa rõ ràng và thiếu thông tin yêu cầu ứng viên',
    minLength: 5,
    maxLength: 500,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do từ chối tin tuyển dụng' })
  @MinLength(5, { message: 'Lý do từ chối phải có ít nhất 5 ký tự' })
  @MaxLength(500, { message: 'Lý do từ chối tối đa 500 ký tự' })
  reason: string;
}
