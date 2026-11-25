import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function createContext(req: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  let guard: RolesGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('cho qua khi không yêu cầu vai trò nào', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('cho qua khi danh sách vai trò rỗng', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('cho qua khi đúng vai trò', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.RECRUITER]);
    const ctx = createContext({ user: { id: 'u1', role: Role.RECRUITER } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('403 khi sai vai trò', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const ctx = createContext({ user: { id: 'u1', role: Role.CANDIDATE } });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('401 khi chưa có user (thiếu JwtAuthGuard phía trước)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(createContext({}))).toThrow(UnauthorizedException);
  });
});
