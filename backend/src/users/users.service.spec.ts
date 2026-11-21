import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(UsersService);
  });

  describe('create', () => {
    const dto = { email: 'a@b.com', password: 'password123', fullName: 'An' };

    it('báo lỗi 409 khi email đã tồn tại (BR-01)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('băm mật khẩu trước khi lưu', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: '1' });

      await service.create(dto);

      const firstCall = prisma.user.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      const data = firstCall[0].data;
      expect(data.passwordHash).toBeDefined();
      expect(data.passwordHash).not.toBe(dto.password);
      expect(data.password).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('báo lỗi 404 khi không tìm thấy', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('trả về items và meta phân trang', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: '1' }], 45]);
      prisma.user.findMany.mockReturnValue('findMany');
      prisma.user.count.mockReturnValue('count');

      const result = await service.findAll({ page: 2, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
      const firstFindManyCall = prisma.user.findMany.mock.calls[0] as [Record<string, unknown>];
      expect(firstFindManyCall[0]).toMatchObject({ skip: 20, take: 20 });
    });
  });
});
