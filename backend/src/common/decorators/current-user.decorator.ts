import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  email?: string;
  role?: string;
  fullName?: string;
}

/**
 * Decorator @CurrentUser(field?)
 * Lấy thông tin người dùng đang đăng nhập từ request.user (do JwtAuthGuard gán vào).
 * Trong giai đoạn dev trước khi Auth hoàn thiện, hỗ trợ fallback đọc id từ header 'x-user-id'
 * để thuận tiện cho việc kiểm thử API và Swagger.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser | undefined =
      request.user ||
      (request.headers['x-user-id']
        ? {
            id: request.headers['x-user-id'] as string,
            role: (request.headers['x-user-role'] as string) || 'CANDIDATE',
          }
        : undefined);

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);

