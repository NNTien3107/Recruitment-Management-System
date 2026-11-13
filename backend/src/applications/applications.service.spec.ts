import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../common/storage';
import { NotificationService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsService } from './applications.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-type-assertion */
describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const mockPrisma: any = {
    cv: {
      findUnique: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    applicationStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callbackOrArray) => {
      if (typeof callbackOrArray === 'function') {
        return callbackOrArray(mockPrisma);
      }
      return Promise.all(callbackOrArray);
    }),
  };

  const mockStorageService = {
    getFile: jest.fn(),
  };

  const mockNotificationService = {
    notify: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('apply (UC09)', () => {
    const candidateId = 'cand-1';
    const dto = {
      jobId: 'job-1',
      cvId: 'cv-1',
      coverLetter: 'Thư xin việc',
    };

    it('nộp đơn ứng tuyển thành công khi tin hợp lệ và chưa từng nộp', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId,
      });

      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'APPROVED',
        deletedAt: null,
        deadline: new Date(Date.now() + 86400000), // Còn hạn
      });

      mockPrisma.application.findUnique.mockResolvedValue(null); // Chưa nộp
      mockPrisma.application.create.mockResolvedValue({
        id: 'app-1',
        candidateId,
        jobId: 'job-1',
        status: 'APPLIED',
      });

      const result = await service.apply(candidateId, dto);

      expect(mockPrisma.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          candidateId,
          jobId: 'job-1',
          status: 'APPLIED',
        }),
      });
      expect(mockPrisma.applicationStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          toStatus: 'APPLIED',
        }),
      });
      expect(result.id).toBe('app-1');
    });

    it('báo lỗi ConflictException (409) khi ứng viên nộp lại lần 2 (BR-02)', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({ id: 'cv-1', candidateId });
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'APPROVED',
        deletedAt: null,
      });
      // Đã có đơn tồn tại
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'existing-app' });

      await expect(service.apply(candidateId, dto)).rejects.toBeInstanceOf(ConflictException);
      expect(mockPrisma.application.create).not.toHaveBeenCalled();
    });

    it('báo lỗi BadRequestException khi tin chưa được duyệt (status !== APPROVED) (BR-03)', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({ id: 'cv-1', candidateId });
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'PENDING', // Chưa duyệt
        deletedAt: null,
      });

      await expect(service.apply(candidateId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('báo lỗi BadRequestException khi tin tuyển dụng đã hết hạn (BR-03)', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({ id: 'cv-1', candidateId });
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'APPROVED',
        deletedAt: null,
        deadline: new Date(Date.now() - 86400000), // Đã hết hạn hôm qua
      });

      await expect(service.apply(candidateId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('báo lỗi BadRequestException khi tin tuyển dụng đã bị xóa mềm (BR-03 / BR-05)', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({ id: 'cv-1', candidateId });
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'APPROVED',
        deletedAt: new Date(), // Bị xóa mềm
      });

      await expect(service.apply(candidateId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('báo lỗi BadRequestException khi sử dụng CV của người khác', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'other-candidate', // Không phải của mình
      });

      await expect(service.apply(candidateId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateStatus (UC18 & State Machine)', () => {
    const applicationId = 'app-1';
    const recruiterId = 'recruiter-1';

    it('chuyển trạng thái thành công khi hợp lệ (APPLIED -> REVIEWING) và gọi notification', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: applicationId,
        status: 'APPLIED',
        candidateId: 'cand-1',
        job: { company: { ownerId: recruiterId }, title: 'NodeJS Developer' },
      });

      mockPrisma.application.update.mockResolvedValue({
        id: applicationId,
        status: 'REVIEWING',
        job: { title: 'NodeJS Developer' },
      });

      const result = await service.updateStatus(applicationId, recruiterId, {
        status: 'REVIEWING' as any,
        note: 'Duyệt hồ sơ bước 1',
      });

      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: applicationId },
        data: { status: 'REVIEWING' },
        include: { job: { select: { title: true } } },
      });

      expect(mockPrisma.applicationStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromStatus: 'APPLIED',
          toStatus: 'REVIEWING',
          changedById: recruiterId,
        }),
      });

      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        'cand-1',
        'APPLICATION_STATUS_CHANGED',
        expect.objectContaining({
          fromStatus: 'APPLIED',
          toStatus: 'REVIEWING',
        }),
      );

      expect(result.status).toBe('REVIEWING');
    });

    it('báo lỗi BadRequestException khi chuyển trạng thái nhảy cóc (APPLIED -> ACCEPTED)', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: applicationId,
        status: 'APPLIED',
        job: { company: { ownerId: recruiterId } },
      });

      await expect(
        service.updateStatus(applicationId, recruiterId, {
          status: 'ACCEPTED' as any,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mockPrisma.application.update).not.toHaveBeenCalled();
      expect(mockNotificationService.notify).not.toHaveBeenCalled();
    });

    it('báo lỗi ForbiddenException khi Recruiter khác cố tình đổi trạng thái', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: applicationId,
        status: 'APPLIED',
        job: { company: { ownerId: 'owner-recruiter' } },
      });

      await expect(
        service.updateStatus(applicationId, 'imposter-recruiter', {
          status: 'REVIEWING' as any,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getJobApplicationsForRecruiter (UC16)', () => {
    it('báo lỗi ForbiddenException nếu tin không thuộc về recruiter đó', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        company: { ownerId: 'other-recruiter' },
      });

      await expect(
        service.getJobApplicationsForRecruiter('job-1', 'recruiter-me', {
          page: 1,
          pageSize: 10,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('downloadApplicantCv (UC17)', () => {
    it('cho phép Recruiter của tin tải CV ứng viên', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        job: { company: { ownerId: 'recruiter-1' } },
        cv: { fileKey: 'cvs/abc.pdf', originalName: 'abc.pdf' },
      });

      mockStorageService.getFile.mockResolvedValue({ stream: 'stream' });

      const result = await service.downloadApplicantCv('app-1', 'recruiter-1');

      expect(result.storedFile).toBeDefined();
      expect(mockStorageService.getFile).toHaveBeenCalledWith('cvs/abc.pdf');
    });

    it('từ chối Recruiter khác không sở hữu tin tải CV ứng viên', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        job: { company: { ownerId: 'recruiter-1' } },
        cv: { fileKey: 'cvs/abc.pdf' },
      });

      await expect(
        service.downloadApplicantCv('app-1', 'recruiter-intruder'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(mockStorageService.getFile).not.toHaveBeenCalled();
    });
  });
});
