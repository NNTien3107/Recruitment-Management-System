import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let passwordHash: string;

  const usersService = { create: jest.fn(), findByEmail: jest.fn() };
  const jwtService = { signAsync: jest.fn() };

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

    it('thành công: trả access token và không lộ passwordHash', async () => {
      usersService.findByEmail.mockResolvedValue({ ...baseUser, passwordHash });
      jwtService.signAsync.mockResolvedValue('token-xyz');

      const result = await service.login(dto);

      expect(result.accessToken).toBe('token-xyz');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.com',
        role: Role.CANDIDATE,
      });
    });
  });
});
