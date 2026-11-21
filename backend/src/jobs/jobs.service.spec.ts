import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobLevel, JobStatus, JobType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobSort } from './dto/query-jobs.dto';
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

  describe('findAllPublic (UC05 - Search, Filter, Sort, Pagination)', () => {
    it('trả về danh sách tin đã APPROVED, chưa xóa mềm, còn hạn và meta phân trang', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'job-1', title: 'Senior Dev' }], 25]);
      prisma.job.findMany.mockReturnValue('findMany');
      prisma.job.count.mockReturnValue('count');

      const result = await service.findAllPublic({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 25, totalPages: 3 });

      const findManyCall = prisma.job.findMany.mock.calls[0] as [
        { where: Prisma.JobWhereInput; orderBy: Prisma.JobOrderByWithRelationInput },
      ];
      expect(findManyCall[0].where.status).toBe(JobStatus.APPROVED);
      expect(findManyCall[0].where.deletedAt).toBeNull();
      expect(findManyCall[0].orderBy).toEqual({ createdAt: 'desc' });
    });

    it('lọc theo skills (hasSome), location, jobType, level, salary và keyword (FR-17, FR-18)', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      prisma.job.findMany.mockReturnValue('findMany');
      prisma.job.count.mockReturnValue('count');

      await service.findAllPublic({
        page: 1,
        pageSize: 20,
        keyword: 'Backend',
        skills: ['NodeJS', 'NestJS'],
        location: 'Hà Nội',
        jobType: JobType.FULL_TIME,
        level: JobLevel.SENIOR,
        salaryMin: 15000000,
        salaryMax: 45000000,
      });

      const findManyCall = prisma.job.findMany.mock.calls[0] as [{ where: Prisma.JobWhereInput }];
      const where = findManyCall[0].where;

      expect(where.skills).toEqual({ hasSome: ['NodeJS', 'NestJS'] });
      expect(where.location).toEqual({ contains: 'Hà Nội', mode: 'insensitive' });
      expect(where.jobType).toBe(JobType.FULL_TIME);
      expect(where.level).toBe(JobLevel.SENIOR);
      expect(where.salaryMax).toEqual({ gte: 15000000 });
      expect(where.salaryMin).toEqual({ lte: 45000000 });
      expect(Array.isArray(where.AND)).toBe(true);
      expect((where.AND as Prisma.JobWhereInput[]).length).toBe(2);
    });

    it('sắp xếp theo lương giảm dần và tăng dần (FR-19)', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      prisma.job.findMany.mockReturnValue('findMany');
      prisma.job.count.mockReturnValue('count');

      await service.findAllPublic({ page: 1, pageSize: 10, sort: JobSort.SALARY_DESC });

      const descCall = prisma.job.findMany.mock.calls[0] as [
        { orderBy: Prisma.JobOrderByWithRelationInput[] },
      ];
      expect(descCall[0].orderBy).toEqual([
        { salaryMax: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ]);

      await service.findAllPublic({ page: 1, pageSize: 10, sort: JobSort.SALARY_ASC });

      const ascCall = prisma.job.findMany.mock.calls[1] as [
        { orderBy: Prisma.JobOrderByWithRelationInput[] },
      ];
      expect(ascCall[0].orderBy).toEqual([
        { salaryMin: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ]);
    });

    it('báo lỗi 400 khi lọc với salaryMin > salaryMax', async () => {
      await expect(
        service.findAllPublic({
          page: 1,
          pageSize: 10,
          salaryMin: 40000000,
          salaryMax: 20000000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne (UC06 & FR-20)', () => {
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

    it('FR-20: khi onlyApproved = true, chỉ lấy tin APPROVED và còn hạn', async () => {
      const mockJob = {
        id: 'job-1',
        title: 'Senior Dev',
        status: JobStatus.APPROVED,
        company: { id: 'comp-1' },
      };
      prisma.job.findFirst.mockResolvedValue(mockJob);

      await service.findOne('job-1', true);

      const findFirstCall = prisma.job.findFirst.mock.calls[0] as [{ where: Prisma.JobWhereInput }];
      expect(findFirstCall[0].where.status).toBe(JobStatus.APPROVED);
      expect(findFirstCall[0].where.deletedAt).toBeNull();
      expect(findFirstCall[0].where.OR).toBeDefined();
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
