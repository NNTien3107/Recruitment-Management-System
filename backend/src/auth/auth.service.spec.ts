import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokensService } from './refresh-tokens.service';

describe('AuthService', () => {
  let service: AuthService;
  let passwordHash: string;

  const usersService = { create: jest.fn(), findByEmail: jest.fn() };
  const jwtService = { signAsync: jest.fn() };
  const refreshTokens = {
    issue: jest.fn(),
    findByRaw: jest.fn(),
    revokeIfActive: jest.fn(),
    revokeByRaw: jest.fn(),
    revokeFamily: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  beforeAll(async () => {
    passwordHash = await argon2.hash('password123');
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokensService, useValue: refreshTokens },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  const baseUser = {
    id: 'u1',
    email: 'a@b.com',
    fullName: 'An',
    role: Role.CANDIDATE,
    isLocked: false,
  };

  describe('register', () => {
    it('mặc định vai trò CANDIDATE', async () => {
      usersService.create.mockResolvedValue({ id: 'u1' });
      await service.register({ email: 'a@b.com', password: 'password123', fullName: 'An' });
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.CANDIDATE }),
      );
    });
  });

  describe('login', () => {
    const dto = { email: 'a@b.com', password: 'password123' };

    it('401 khi email không tồn tại', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('401 khi sai mật khẩu', async () => {
      usersService.findByEmail.mockResolvedValue({ ...baseUser, passwordHash });
      await expect(service.login({ ...dto, password: 'sai-mat-khau' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('403 khi tài khoản bị khóa', async () => {
      usersService.findByEmail.mockResolvedValue({ ...baseUser, passwordHash, isLocked: true });
      await expect(service.login(dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('thành công: trả access token, refresh token và không lộ passwordHash', async () => {
      usersService.findByEmail.mockResolvedValue({ ...baseUser, passwordHash });
      jwtService.signAsync.mockResolvedValue('token-xyz');
      refreshTokens.issue.mockResolvedValue('refresh-xyz');

      const result = await service.login(dto);

      expect(result.accessToken).toBe('token-xyz');
      expect(result.refreshToken).toBe('refresh-xyz');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('refresh', () => {
    const stored = () => ({
      id: 't1',
      userId: 'u1',
      familyId: 'f1',
      revokedAt: null as Date | null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...baseUser },
    });

    it('401 khi không có cookie', async () => {
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('401 khi token không tồn tại', async () => {
      refreshTokens.findByRaw.mockResolvedValue(null);
      await expect(service.refresh('raw')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('token đã thu hồi bị dùng lại: thu hồi cả họ và trả 401', async () => {
      refreshTokens.findByRaw.mockResolvedValue({ ...stored(), revokedAt: new Date() });
      await expect(service.refresh('raw')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshTokens.revokeFamily).toHaveBeenCalledWith('f1');
    });

    it('401 khi token hết hạn', async () => {
      refreshTokens.findByRaw.mockResolvedValue({
        ...stored(),
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refresh('raw')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('tài khoản bị khóa: thu hồi mọi token và trả 403 (BR-06)', async () => {
      const s = stored();
      s.user.isLocked = true;
      refreshTokens.findByRaw.mockResolvedValue(s);
      await expect(service.refresh('raw')).rejects.toBeInstanceOf(ForbiddenException);
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    });

    it('hai request song song: bên thua bị 401 và thu hồi cả họ', async () => {
      refreshTokens.findByRaw.mockResolvedValue(stored());
      refreshTokens.revokeIfActive.mockResolvedValue(false);
      await expect(service.refresh('raw')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshTokens.revokeFamily).toHaveBeenCalledWith('f1');
    });

    it('thành công: xoay token, giữ nguyên familyId', async () => {
      refreshTokens.findByRaw.mockResolvedValue(stored());
      refreshTokens.revokeIfActive.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('at2');
      refreshTokens.issue.mockResolvedValue('rt2');

      const result = await service.refresh('raw');

      expect(result).toEqual({ accessToken: 'at2', refreshToken: 'rt2' });
      expect(refreshTokens.revokeIfActive).toHaveBeenCalledWith('t1');
      expect(refreshTokens.issue).toHaveBeenCalledWith('u1', 'f1');
    });
  });

  describe('logout', () => {
    it('thu hồi token trong cookie', async () => {
      await service.logout('raw');
      expect(refreshTokens.revokeByRaw).toHaveBeenCalledWith('raw');
    });

    it('không lỗi khi không có cookie', async () => {
      await expect(service.logout(undefined)).resolves.toBeNull();
      expect(refreshTokens.revokeByRaw).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('thu hồi toàn bộ token của người dùng', async () => {
      await service.revokeAllUserTokens('u1');
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    });
  });
});
