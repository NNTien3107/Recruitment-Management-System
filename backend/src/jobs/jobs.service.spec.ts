import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobLevel, JobStatus, JobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  const prisma = {
    job: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [JobsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(JobsService);
  });

  describe('create (BR-04)', () => {
    const dto: CreateJobDto = {
      recruiterId: '11111111-1111-1111-1111-111111111111',
      title: 'Senior Backend Engineer',
      description: 'Lập trình viên NodeJS / NestJS chất lượng cao',
      location: 'Hà Nội',
      skills: ['NodeJS', 'NestJS'],
      salaryMin: 20000000,
      salaryMax: 40000000,
      jobType: JobType.FULL_TIME,
      level: JobLevel.SENIOR,
    };

    it('báo lỗi 400 khi recruiter chưa có thông tin công ty (BR-04)', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.job.create).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi mức lương min > max', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'comp-1', ownerId: dto.recruiterId });

      await expect(
        service.create({ ...dto, salaryMin: 50000000, salaryMax: 20000000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.job.create).not.toHaveBeenCalled();
    });

    it('tạo tin tuyển dụng thành công khi recruiter đã có công ty', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'comp-1', ownerId: dto.recruiterId });
      prisma.job.create.mockResolvedValue({ id: 'job-1', ...dto, companyId: 'comp-1' });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 'job-1');
      const createCall = prisma.job.create.mock.calls[0] as [{ data: { companyId: string } }];
      expect(createCall[0].data.companyId).toBe('comp-1');
    });
  });

  describe('findAllPublic', () => {
    it('trả về danh sách tin đã APPROVED và meta phân trang', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'job-1', title: 'Senior Dev' }], 25]);
      prisma.job.findMany.mockReturnValue('findMany');
      prisma.job.count.mockReturnValue('count');

      const result = await service.findAllPublic({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 25, totalPages: 3 });

      const findManyCall = prisma.job.findMany.mock.calls[0] as [
        { where: { status: JobStatus; deletedAt: null } },
      ];
      expect(findManyCall[0].where.status).toBe(JobStatus.APPROVED);
      expect(findManyCall[0].where.deletedAt).toBeNull();
    });
  });

  describe('findOne', () => {
    it('báo lỗi 404 khi tin tuyển dụng không tồn tại', async () => {
      prisma.job.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('trả về thông tin chi tiết tin khi tìm thấy', async () => {
      const mockJob = { id: 'job-1', title: 'Senior Dev', company: { id: 'comp-1' } };
      prisma.job.findFirst.mockResolvedValue(mockJob);

      const result = await service.findOne('job-1');
      expect(result).toEqual(mockJob);
    });
  });

  describe('update (BR-08 & Quyền sở hữu)', () => {
    const ownerId = 'recruiter-1';
    const mockApprovedJob = {
      id: 'job-1',
      title: 'Old Title',
      status: JobStatus.APPROVED,
      approvedAt: new Date(),
      company: { ownerId },
    };

    it('báo lỗi 403 khi recruiter khác cố tình sửa tin', async () => {
      prisma.job.findFirst.mockResolvedValue(mockApprovedJob);

      await expect(
        service.update('job-1', 'other-recruiter', { title: 'Hacked Title' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('BR-08: tự động chuyển tin APPROVED về PENDING khi sửa nội dung quan trọng', async () => {
      prisma.job.findFirst.mockResolvedValue(mockApprovedJob);
      prisma.job.update.mockResolvedValue({ ...mockApprovedJob, status: JobStatus.PENDING });

      await service.update('job-1', ownerId, { title: 'New Senior Backend Title' });

      const updateCall = prisma.job.update.mock.calls[0] as [
        { data: { status: JobStatus; approvedAt: null } },
      ];
      expect(updateCall[0].data.status).toBe(JobStatus.PENDING);
      expect(updateCall[0].data.approvedAt).toBeNull();
    });

    it('không đổi status sang PENDING nếu tin ban đầu là DRAFT', async () => {
      const mockDraftJob = {
        id: 'job-2',
        title: 'Draft Title',
        status: JobStatus.DRAFT,
        company: { ownerId },
      };
      prisma.job.findFirst.mockResolvedValue(mockDraftJob);
      prisma.job.update.mockResolvedValue({ ...mockDraftJob, title: 'Updated Draft' });

      await service.update('job-2', ownerId, { title: 'Updated Draft' });

      const updateCall = prisma.job.update.mock.calls[0] as [{ data: { status?: JobStatus } }];
      expect(updateCall[0].data.status).toBeUndefined();
    });
  });

  describe('close (UC15)', () => {
    const ownerId = 'recruiter-1';
    const mockJob = { id: 'job-1', status: JobStatus.APPROVED, company: { ownerId } };

    it('báo lỗi 403 khi recruiter khác đóng tin', async () => {
      prisma.job.findFirst.mockResolvedValue(mockJob);

      await expect(service.close('job-1', 'other-recruiter')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('đóng tin thành công và cập nhật status = CLOSED', async () => {
      prisma.job.findFirst.mockResolvedValue(mockJob);
      prisma.job.update.mockResolvedValue({ ...mockJob, status: JobStatus.CLOSED });

      await service.close('job-1', ownerId);

      const updateCall = prisma.job.update.mock.calls[0] as [
        { data: { status: JobStatus; closedAt: Date } },
      ];
      expect(updateCall[0].data.status).toBe(JobStatus.CLOSED);
      expect(updateCall[0].data.closedAt).toBeDefined();
    });
  });

  describe('remove (BR-05 - Soft Delete)', () => {
    const ownerId = 'recruiter-1';
    const mockJob = { id: 'job-1', company: { ownerId } };

    it('báo lỗi 403 khi recruiter khác xóa tin', async () => {
      prisma.job.findFirst.mockResolvedValue(mockJob);

      await expect(service.remove('job-1', 'other-recruiter')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('xóa mềm tin tuyển dụng bằng cách gán deletedAt (BR-05)', async () => {
      prisma.job.findFirst.mockResolvedValue(mockJob);
      prisma.job.update.mockResolvedValue({ ...mockJob, deletedAt: new Date() });

      await service.remove('job-1', ownerId);

      const updateCall = prisma.job.update.mock.calls[0] as [
        { data: { deletedAt: Date; status: JobStatus } },
      ];
      expect(updateCall[0].data.deletedAt).toBeDefined();
      expect(updateCall[0].data.status).toBe(JobStatus.CLOSED);
    });
  });
});
