import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(req: object): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const prisma = { user: { findUnique: jest.fn() } };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new JwtAuthGuard(jwtService as never, prisma as never);
  });

  it('401 khi thiếu header Authorization', async () => {
    const ctx = createContext({ headers: {} });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401 khi header không phải Bearer', async () => {
    const ctx = createContext({ headers: { authorization: 'Basic abc' } });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401 khi token sai hoặc hết hạn', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const ctx = createContext({ headers: { authorization: 'Bearer bad' } });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401 khi tài khoản không còn trong DB', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
    prisma.user.findUnique.mockResolvedValue(null);
    const ctx = createContext({ headers: { authorization: 'Bearer ok' } });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('403 khi tài khoản bị khóa (chặn ngay dù token còn hạn)', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: Role.CANDIDATE,
      isLocked: true,
    });
    const ctx = createContext({ headers: { authorization: 'Bearer ok' } });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('thành công: gắn user (lấy từ DB) vào request', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', role: Role.CANDIDATE });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: Role.RECRUITER, // DB là nguồn đúng, khác với token cũ
      isLocked: false,
    });
    const req: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: 'Bearer ok' },
    };

    await expect(guard.canActivate(createContext(req))).resolves.toBe(true);
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.com', role: Role.RECRUITER });
  });
});
