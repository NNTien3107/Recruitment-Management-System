import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

// Không cho phép đổi ownerId của công ty sau khi đã tạo
export class UpdateCompanyDto extends PartialType(
  OmitType(CreateCompanyDto, ['ownerId'] as const),
) {}
