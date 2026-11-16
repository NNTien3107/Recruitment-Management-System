import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  const prisma = {
    job: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AdminService);
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
