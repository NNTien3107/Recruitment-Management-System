import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CandidatesService } from './candidates.service';

describe('CandidatesService', () => {
  let service: CandidatesService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    candidateProfile: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidatesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  describe('getProfile', () => {
    it('trả về hồ sơ ứng viên nếu đã tồn tại', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'candidate@test.com',
        fullName: 'Nguyễn Văn A',
        role: 'CANDIDATE',
        candidateProfile: {
          id: 'cp-1',
          userId: 'u-1',
          phone: '0123456789',
          title: 'NodeJS Developer',
          skills: ['NestJS', 'PostgreSQL'],
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('u-1');

      expect(result.userId).toBe('u-1');
      expect(result.fullName).toBe('Nguyễn Văn A');
      expect(result.profile.title).toBe('NodeJS Developer');
    });

    it('trả về hồ sơ rỗng mặc định nếu người dùng chưa điền hồ sơ', async () => {
      const mockUser = {
        id: 'u-2',
        email: 'new@test.com',
        fullName: 'Người Mới',
        role: 'CANDIDATE',
        candidateProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('u-2');

      expect(result.userId).toBe('u-2');
      expect(result.profile.skills).toEqual([]);
      expect(result.profile.phone).toBeNull();
    });

    it('báo lỗi NotFoundException nếu không tìm thấy người dùng', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('unknown-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('báo lỗi NotFoundException nếu người dùng không tồn tại', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('u-unknown', { title: 'Tester' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('cập nhật họ tên người dùng và upsert thông tin hồ sơ', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 'u-1', fullName: 'Tên Cũ' })
        .mockResolvedValueOnce({ id: 'u-1', fullName: 'Tên Mới', email: 'a@b.com' });

      mockPrismaService.candidateProfile.upsert.mockResolvedValue({
        id: 'cp-1',
        userId: 'u-1',
        title: 'Senior Developer',
        skills: ['TypeScript', 'Docker'],
      });

      const dto = {
        fullName: 'Tên Mới',
        title: 'Senior Developer',
        skills: ['TypeScript', 'Docker'],
      };

      const result = await service.updateProfile('u-1', dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { fullName: 'Tên Mới' },
      });
      expect(mockPrismaService.candidateProfile.upsert).toHaveBeenCalled();
      expect(result.profile.title).toBe('Senior Developer');
    });
  });
});
