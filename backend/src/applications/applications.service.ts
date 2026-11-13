import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StorageService } from '../common/storage';
import { buildPaginated } from '../common/utils/pagination';
import { NotificationService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { canTransition } from './utils/application-state-machine';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Ứng tuyển vào một tin việc làm (UC09).
   * Kiểm tra ràng buộc:
   * - BR-02: Mỗi ứng viên chỉ nộp đúng 1 đơn cho 1 tin (unique candidateId + jobId).
   * - BR-03: Không ứng tuyển được tin đã đóng, hết hạn hoặc chưa duyệt (status === APPROVED).
   * - CV phải thuộc sở hữu của chính ứng viên đó.
   */
  async apply(candidateId: string, dto: CreateApplicationDto) {
    // 1. Kiểm tra CV có tồn tại và thuộc về ứng viên đang đăng nhập không
    const cv = await this.prisma.cv.findUnique({ where: { id: dto.cvId } });
    if (!cv || cv.candidateId !== candidateId) {
      throw new BadRequestException('CV được chọn không tồn tại hoặc không thuộc sở hữu của bạn');
    }

    // 2. Kiểm tra tin tuyển dụng (Job)
    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job) {
      throw new NotFoundException('Tin tuyển dụng không tồn tại');
    }

    // BR-03: Chỉ ứng tuyển tin đã APPROVED, chưa bị xóa mềm và chưa hết hạn
    const isApproved = job.status === 'APPROVED';
    const isNotDeleted = !job.deletedAt;
    const isNotExpired = !job.deadline || new Date(job.deadline) >= new Date();

    if (!isApproved || !isNotDeleted || !isNotExpired) {
      throw new BadRequestException(
        'Tin tuyển dụng này hiện không nhận đơn ứng tuyển (đã đóng, chưa duyệt hoặc hết hạn) (BR-03)',
      );
    }

    // BR-02: Kiểm tra ứng viên đã nộp đơn cho tin này chưa
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId,
          jobId: dto.jobId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException(
        'Bạn đã nộp đơn ứng tuyển cho vị trí này rồi. Mỗi ứng viên chỉ được nộp một lần (BR-02)',
      );
    }

    // 3. Thực hiện tạo đơn và ghi nhận lịch sử trạng thái đầu tiên trong 1 Transaction
    const application = await this.prisma.$transaction(async (tx) => {
      const createdApp = await tx.application.create({
        data: {
          candidateId,
          jobId: dto.jobId,
          cvId: dto.cvId,
          coverLetter: dto.coverLetter,
          status: 'APPLIED',
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: createdApp.id,
          fromStatus: null,
          toStatus: 'APPLIED',
          changedById: candidateId,
          note: 'Ứng viên nộp hồ sơ ứng tuyển',
        },
      });

      return createdApp;
    });

    return application;
  }

  /**
   * Xem lịch sử danh sách các vị trí mà ứng viên đã ứng tuyển (UC10).
   */
  async getMyApplications(candidateId: string, query: QueryApplicationsDto) {
    const { page, pageSize, status, keyword } = query;

    const where: Prisma.ApplicationWhereInput = {
      candidateId,
      ...(status && { status }),
      ...(keyword && {
        job: {
          title: { contains: keyword, mode: 'insensitive' },
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              deadline: true,
            },
          },
          cv: {
            select: {
              id: true,
              name: true,
              originalName: true,
              fileKey: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Xem chi tiết một đơn ứng tuyển của chính mình kèm timeline tiến trình (UC10).
   */
  async getMyApplicationDetail(id: string, candidateId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        cv: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedBy: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!application || application.candidateId !== candidateId) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển của bạn');
    }

    return application;
  }

  /**
   * Phía Nhà tuyển dụng: Xem danh sách ứng viên theo tin tuyển dụng (UC16).
   * Kiểm tra quyền: Tin tuyển dụng phải thuộc sở hữu của Recruiter đang đăng nhập.
   */
  async getJobApplicationsForRecruiter(
    jobId: string,
    recruiterId: string,
    query: QueryApplicationsDto,
  ) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Bạn không có quyền quản lý ứng viên của tin tuyển dụng này');
    }

    const { page, pageSize, status, keyword } = query;

    const where: Prisma.ApplicationWhereInput = {
      jobId,
      ...(status && { status }),
      ...(keyword && {
        OR: [
          { candidate: { fullName: { contains: keyword, mode: 'insensitive' } } },
          { candidate: { email: { contains: keyword, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              email: true,
              fullName: true,
              candidateProfile: true,
            },
          },
          cv: {
            select: {
              id: true,
              name: true,
              originalName: true,
              fileKey: true,
              fileSize: true,
              mimeType: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Phía Nhà tuyển dụng: Xem chi tiết hồ sơ ứng viên của một đơn ứng tuyển (UC17).
   */
  async getApplicationDetailForRecruiter(applicationId: string, recruiterId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: {
          select: {
            id: true,
            email: true,
            fullName: true,
            candidateProfile: true,
          },
        },
        cv: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedBy: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }

    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn ứng tuyển này');
    }

    return application;
  }

  /**
   * Phía Nhà tuyển dụng: Cập nhật trạng thái đơn ứng tuyển (UC18).
   * - Bắt buộc kiểm tra qua hàm `canTransition(from, to)`.
   * - Ghi nhận 1 dòng log vào `ApplicationStatusHistory`.
   * - Kích hoạt `NotificationService` để gửi email/thông báo cho ứng viên.
   */
  async updateStatus(
    applicationId: string,
    recruiterId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }

    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên đơn ứng tuyển này');
    }

    const currentStatus = application.status;
    const newStatus = dto.status;

    // Kiểm tra ma trận chuyển trạng thái hợp lệ
    const isAllowed = canTransition(currentStatus, newStatus);
    if (!isAllowed) {
      throw new BadRequestException(
        `Chuyển đổi trạng thái không hợp lệ: không thể chuyển từ ${currentStatus} sang ${newStatus}`,
      );
    }

    // Cập nhật trạng thái và ghi log lịch sử trong cùng Transaction
    const updatedApplication = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: { status: newStatus },
        include: {
          job: { select: { title: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedById: recruiterId,
          note: dto.note || `Nhà tuyển dụng chuyển trạng thái sang ${newStatus}`,
        },
      });

      return app;
    });

    // Bắn sự kiện thông báo (Thành viên Thành sẽ nhận sự kiện này để gửi email)
    await this.notificationService.notify(
      application.candidateId,
      'APPLICATION_STATUS_CHANGED',
      {
        applicationId,
        jobTitle: updatedApplication.job.title,
        fromStatus: currentStatus,
        toStatus: newStatus,
        note: dto.note,
      },
    );

    return updatedApplication;
  }

  /**
   * Phía Nhà tuyển dụng: Tải CV của ứng viên nộp cho tin tuyển dụng (UC17).
   */
  async downloadApplicantCv(applicationId: string, recruiterId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        cv: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }

    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException('Bạn không có quyền tải CV của đơn ứng tuyển này');
    }

    const storedFile = await this.storageService.getFile(application.cv.fileKey);

    return {
      cv: application.cv,
      storedFile,
    };
  }
}

