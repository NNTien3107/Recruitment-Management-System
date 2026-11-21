import { PickType } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, [
  'email',
  'password',
  'fullName',
] as const) {
  // Chỉ cho tự đăng ký 2 vai trò này; ADMIN do hệ thống tạo
  @IsOptional()
  @IsIn([Role.CANDIDATE, Role.RECRUITER])
  role?: Role;
}
