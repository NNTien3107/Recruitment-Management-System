import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * @Auth()                       đăng nhập là đủ
 * @Auth(Role.RECRUITER)         chỉ Recruiter
 * @Auth(Role.ADMIN, Role.RECRUITER)  Admin hoặc Recruiter
 * Dùng được ở cả class lẫn method.
 */
export function Auth(...roles: Role[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token không hợp lệ' }),
    ApiForbiddenResponse({ description: 'Không đủ quyền hoặc tài khoản bị khóa' }),
  );
}
