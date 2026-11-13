import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  private dummyHash?: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    // Luôn băm/so khớp một lần kể cả khi email không tồn tại,
    // để thời gian phản hồi không lộ email nào có trong hệ thống
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const passwordOk = await argon2.verify(hash, dto.password);

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.isLocked) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  private async getDummyHash() {
    this.dummyHash ??= await argon2.hash('dummy-password-for-timing');
    return this.dummyHash;
  }
}
