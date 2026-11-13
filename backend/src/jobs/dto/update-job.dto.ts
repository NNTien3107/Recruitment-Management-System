import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

// Cho phép cập nhật từng phần thông tin tin tuyển dụng
export class UpdateJobDto extends PartialType(OmitType(CreateJobDto, ['recruiterId'] as const)) {}
