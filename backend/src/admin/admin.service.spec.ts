import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobStatus, Prisma, Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

jest.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}));

describe('AdminService', () => {
  let service: AdminService;

  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    job: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const authService = {
    revokeAllUserTokens: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  it('returns system-wide counts and excludes soft-deleted jobs', async () => {
    prisma.$transaction.mockResolvedValue([5, 2]);

    await expect(service.getDashboard()).resolves.toEqual({
      userCount: 5,
      jobCount: 2,
      applicationCount: null,
    });
    expect(prisma.user.count).toHaveBeenCalledWith();
    expect(prisma.job.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
  });

  describe('findAllUsers (UC21, FR-31)', () => {
    it('trả về danh sách người dùng và meta phân trang, hỗ trợ lọc theo role, isLocked, keyword', async () => {
      prisma.$transaction.mockResolvedValue([
        [{ id: 'user-1', email: 'candidate@test.com', role: Role.CANDIDATE, isLocked: false }],
        1,
      ]);
      prisma.user.findMany.mockReturnValue('findMany');
      prisma.user.count.mockReturnValue('count');

      const result = await service.findAllUsers({
        page: 1,
        pageSize: 10,
        role: Role.CANDIDATE,
        isLocked: false,
        keyword: 'candidate',
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 });

      const findManyCall = prisma.user.findMany.mock.calls[0] as [{ where: Prisma.UserWhereInput }];
      expect(findManyCall[0].where.role).toBe(Role.CANDIDATE);
      expect(findManyCall[0].where.isLocked).toBe(false);
      expect(findManyCall[0].where.OR).toBeDefined();
    });
  });

  describe('findUserById (UC21, FR-31)', () => {
    it('báo lỗi 404 khi không tìm thấy người dùng', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findUserById('non-existent-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('trả về chi tiết người dùng khi tìm thấy', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'recruiter@test.com',
        role: Role.RECRUITER,
        isLocked: false,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserById('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('lockUser (UC22, FR-32, BR-06)', () => {
    it('báo lỗi 404 khi người dùng không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.lockUser('non-existent-id')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(authService.revokeAllUserTokens).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi cố khóa tài khoản có vai trò ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: Role.ADMIN,
        isLocked: false,
      });

      await expect(service.lockUser('admin-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(authService.revokeAllUserTokens).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi tài khoản đã ở trạng thái bị khóa (isLocked = true)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: Role.CANDIDATE,
        isLocked: true,
      });

      await expect(service.lockUser('user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(authService.revokeAllUserTokens).not.toHaveBeenCalled();
    });

    it('khóa thành công tài khoản và thu hồi toàn bộ refresh token của người dùng (BR-06)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@test.com',
        role: Role.RECRUITER,
        isLocked: false,
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'user1@test.com',
        role: Role.RECRUITER,
        isLocked: true,
      });
      authService.revokeAllUserTokens.mockResolvedValue(undefined);

      const result = await service.lockUser('user-1');

      expect(result.isLocked).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { isLocked: true },
        }),
      );
      expect(authService.revokeAllUserTokens).toHaveBeenCalledTimes(1);
      expect(authService.revokeAllUserTokens).toHaveBeenCalledWith('user-1');
    });
  });

  describe('unlockUser (UC22, FR-32)', () => {
    it('báo lỗi 404 khi người dùng không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.unlockUser('non-existent-id')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi tài khoản đang hoạt động bình thường (isLocked = false)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: Role.CANDIDATE,
        isLocked: false,
      });

      await expect(service.unlockUser('user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('mở khóa thành công tài khoản đang bị khóa: chuyển isLocked = false', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@test.com',
        role: Role.CANDIDATE,
        isLocked: true,
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'user1@test.com',
        role: Role.CANDIDATE,
        isLocked: false,
      });

      const result = await service.unlockUser('user-1');

      expect(result.isLocked).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { isLocked: false },
        }),
      );
    });
  });

  describe('findAllJobs', () => {
    it('trả về danh sách tin tuyển dụng và meta phân trang cho Admin', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'job-1', status: JobStatus.PENDING }], 12]);
      prisma.job.findMany.mockReturnValue('findMany');
      prisma.job.count.mockReturnValue('count');

      const result = await service.findAllJobs({
        page: 1,
        pageSize: 10,
        status: JobStatus.PENDING,
        keyword: 'Backend',
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 12, totalPages: 2 });

      const findManyCall = prisma.job.findMany.mock.calls[0] as [{ where: Prisma.JobWhereInput }];
      expect(findManyCall[0].where.status).toBe(JobStatus.PENDING);
      expect(findManyCall[0].where.deletedAt).toBeNull();
      expect(findManyCall[0].where.OR).toBeDefined();
    });
  });

  describe('findJobById', () => {
    it('báo lỗi 404 khi không tìm thấy tin tuyển dụng', async () => {
      prisma.job.findFirst.mockResolvedValue(null);

      await expect(service.findJobById('non-existent-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('trả về chi tiết tin tuyển dụng khi tìm thấy', async () => {
      const mockJob = { id: 'job-1', title: 'Backend Dev', status: JobStatus.PENDING };
      prisma.job.findFirst.mockResolvedValue(mockJob);

      const result = await service.findJobById('job-1');
      expect(result).toEqual(mockJob);
    });
  });

  describe('approveJob (UC23, FR-33)', () => {
    it('báo lỗi 404 khi tin không tồn tại', async () => {
      prisma.job.findFirst.mockResolvedValue(null);

      await expect(service.approveJob('non-existent-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('báo lỗi 400 khi tin không ở trạng thái PENDING (vd: DRAFT, APPROVED, CLOSED)', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.DRAFT,
      });

      await expect(service.approveJob('job-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.job.update).not.toHaveBeenCalled();
    });

    it('duyệt thành công tin PENDING: chuyển status = APPROVED, gán approvedAt và xóa rejectReason', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.PENDING,
        rejectReason: 'Lý do cũ',
      });
      prisma.job.update.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.APPROVED,
        approvedAt: new Date(),
        rejectReason: null,
      });

      const result = await service.approveJob('job-1');

      expect(result.status).toBe(JobStatus.APPROVED);
      const updateCall = prisma.job.update.mock.calls[0] as [
        { data: { status: JobStatus; approvedAt: Date; rejectReason: null } },
      ];
      expect(updateCall[0].data.status).toBe(JobStatus.APPROVED);
      expect(updateCall[0].data.approvedAt).toBeInstanceOf(Date);
      expect(updateCall[0].data.rejectReason).toBeNull();
    });
  });

  describe('rejectJob (UC23, FR-33)', () => {
    const rejectDto = { reason: 'Mô tả công việc không rõ ràng' };

    it('báo lỗi 404 khi tin không tồn tại', async () => {
      prisma.job.findFirst.mockResolvedValue(null);

      await expect(service.rejectJob('non-existent-id', rejectDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('báo lỗi 400 khi tin không ở trạng thái PENDING (vd: APPROVED, CLOSED)', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.APPROVED,
      });

      await expect(service.rejectJob('job-1', rejectDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.job.update).not.toHaveBeenCalled();
    });

    it('từ chối thành công tin PENDING: chuyển status = REJECTED, lưu rejectReason và xóa approvedAt', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.PENDING,
      });
      prisma.job.update.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.REJECTED,
        rejectReason: rejectDto.reason,
        approvedAt: null,
      });

      const result = await service.rejectJob('job-1', rejectDto);

      expect(result.status).toBe(JobStatus.REJECTED);
      expect(result.rejectReason).toBe(rejectDto.reason);

      const updateCall = prisma.job.update.mock.calls[0] as [
        { data: { status: JobStatus; rejectReason: string; approvedAt: null } },
      ];
      expect(updateCall[0].data.status).toBe(JobStatus.REJECTED);
      expect(updateCall[0].data.rejectReason).toBe(rejectDto.reason);
      expect(updateCall[0].data.approvedAt).toBeNull();
    });
  });
});
