import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokensService } from './refresh-tokens.service';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  private dummyHash?: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokens: RefreshTokensService,
  ) {}

  // UC01
  register(dto: RegisterDto) {
    return this.usersService.create({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role ?? Role.CANDIDATE,
    });
  }

  // UC02
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const passwordOk = await argon2.verify(hash, dto.password);

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.isLocked) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const tokens = await this.issueTokens(user);
    return {
      ...tokens, // accessToken + refreshToken (controller đưa refreshToken vào cookie)
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  // UC04: làm mới token (rotation + phát hiện dùng lại)
  async refresh(rawToken: string | undefined) {
    if (!rawToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }

    const stored = await this.refreshTokens.findByRaw(rawToken);
    if (!stored) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Token đã thu hồi mà vẫn bị dùng: nghi bị đánh cắp, thu hồi cả phiên
    if (stored.revokedAt) {
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }
    if (stored.user.isLocked) {
      await this.revokeAllUserTokens(stored.userId);
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    // Thu hồi token cũ; nếu có request khác đã nhanh tay hơn thì coi như dùng lại
    const claimed = await this.refreshTokens.revokeIfActive(stored.id);
    if (!claimed) {
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    return this.issueTokens(stored.user, stored.familyId);
  }

  // UC03
  async logout(rawToken: string | undefined) {
    if (rawToken) {
      await this.refreshTokens.revokeByRaw(rawToken);
    }
    return null;
  }

  /**
   * BR-06: thu hồi MỌI refresh token của một người dùng.
   * Module Admin (UC22) gọi hàm này ngay sau khi khóa tài khoản.
   */
  revokeAllUserTokens(userId: string) {
    return this.refreshTokens.revokeAllForUser(userId);
  }

  private async issueTokens(user: { id: string; email: string; role: Role }, familyId?: string) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.refreshTokens.issue(user.id, familyId),
    ]);
    return { accessToken, refreshToken };
  }

  private async getDummyHash() {
    this.dummyHash ??= await argon2.hash('dummy-password-for-timing');
    return this.dummyHash;
  }
}
