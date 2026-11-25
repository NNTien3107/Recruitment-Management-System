import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../types/auth-user';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Thiếu access token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Access token không hợp lệ hoặc đã hết hạn');
    }

    // Lấy dữ liệu mới nhất từ DB thay vì tin hoàn toàn vào nội dung token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isLocked: true },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (user.isLocked) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }

  private extractToken(req: AuthenticatedRequest): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
