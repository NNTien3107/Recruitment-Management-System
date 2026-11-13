import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prisma = {
    company: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [CompaniesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CompaniesService);
  });

  describe('create', () => {
    const dto: CreateCompanyDto = {
      ownerId: '11111111-1111-1111-1111-111111111111',
      name: 'Tech Corp Vietnam',
      industry: 'Công nghệ thông tin',
      size: '50-100',
    };

    it('báo lỗi 404 khi ownerId không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it('báo lỗi 403 khi owner không phải là RECRUITER', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: dto.ownerId, role: Role.CANDIDATE });

      await expect(service.create(dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it('báo lỗi 409 khi recruiter đã sở hữu công ty (ràng buộc 1-1 - UC13)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: dto.ownerId, role: Role.RECRUITER });
      prisma.company.findUnique.mockResolvedValue({ id: 'comp-1', ownerId: dto.ownerId });

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it('tạo công ty thành công khi dữ liệu hợp lệ', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: dto.ownerId, role: Role.RECRUITER });
      prisma.company.findUnique.mockResolvedValue(null);
      prisma.company.create.mockResolvedValue({ id: 'comp-1', ...dto });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 'comp-1');
      const createCall = prisma.company.create.mock.calls[0] as [{ data: CreateCompanyDto }];
      expect(createCall[0].data.name).toBe(dto.name);
      expect(createCall[0].data.ownerId).toBe(dto.ownerId);
    });
  });

  describe('findAll', () => {
    it('trả về danh sách công ty và meta phân trang', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'comp-1', name: 'Tech Corp' }], 15]);
      prisma.company.findMany.mockReturnValue('findMany');
      prisma.company.count.mockReturnValue('count');

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 2, pageSize: 10, total: 15, totalPages: 2 });

      const findManyCall = prisma.company.findMany.mock.calls[0] as [Record<string, unknown>];
      expect(findManyCall[0]).toMatchObject({ skip: 10, take: 10 });
    });
  });

  describe('findOne', () => {
    it('báo lỗi 404 khi không tìm thấy công ty', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('trả về chi tiết công ty khi tìm thấy', async () => {
      const mockCompany = { id: 'comp-1', name: 'Tech Corp' };
      prisma.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.findOne('comp-1');
      expect(result).toEqual(mockCompany);
    });
  });

  describe('findByOwnerId', () => {
    it('báo lỗi 404 khi recruiter chưa tạo công ty', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.findByOwnerId('owner-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('trả về công ty của recruiter khi tìm thấy', async () => {
      const mockCompany = { id: 'comp-1', ownerId: 'owner-1', name: 'Tech Corp' };
      prisma.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.findByOwnerId('owner-1');
      expect(result).toEqual(mockCompany);
    });
  });

  describe('update', () => {
    it('báo lỗi 404 khi cập nhật công ty không tồn tại', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'New Name' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('cập nhật thông tin công ty thành công', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'comp-1', name: 'Old Name' });
      prisma.company.update.mockResolvedValue({ id: 'comp-1', name: 'New Name' });

      const result = await service.update('comp-1', { name: 'New Name' });
      expect(result).toHaveProperty('name', 'New Name');
    });
  });
});
