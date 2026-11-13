import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { buildPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Các cột được phép trả ra ngoài: KHÔNG có passwordHash
export const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isLocked: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng'); // BR-01
    }

    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
      },
      select: userSelect,
    });
  }

  async findAll(query: QueryUsersDto) {
    const { page, pageSize, keyword, role } = query;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(keyword && {
        OR: [
          { email: { contains: keyword, mode: 'insensitive' } },
          { fullName: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // báo 404 rõ ràng nếu không tồn tại
    return this.prisma.user.update({ where: { id }, data: dto, select: userSelect });
  }

  // Dành cho AuthService (bước 7): cần passwordHash nên KHÔNG dùng userSelect
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
