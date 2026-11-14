import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { buildPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { RejectJobDto } from './dto/reject-job.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách tin tuyển dụng dành cho Admin kiểm duyệt (UC23)
   * Hỗ trợ lọc theo trạng thái (PENDING, APPROVED, REJECTED, DRAFT, CLOSED), công ty và từ khóa.
   */
  async findAllJobs(query: QueryAdminJobsDto) {
    const { page, pageSize, status, companyId, keyword } = query;

    const where: Prisma.JobWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(companyId && { companyId }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { company: { name: { contains: keyword, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              address: true,
              ownerId: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Xem chi tiết tin tuyển dụng dành cho Admin thẩm định (mọi trạng thái chưa xóa mềm)
   */
  async findJobById(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    return job;
  }

  /**
   * Duyệt tin tuyển dụng (UC23, FR-33)
   * Chỉ cho phép duyệt tin đang ở trạng thái PENDING.
   */
  async approveJob(id: string) {
    const job = await this.findJobById(id);

    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ có thể duyệt tin đang ở trạng thái PENDING (trạng thái hiện tại: ${job.status})`,
      );
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.APPROVED,
        approvedAt: new Date(),
        rejectReason: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  /**
   * Từ chối tin tuyển dụng kèm lý do (UC23, FR-33)
   * Chỉ cho phép từ chối tin đang ở trạng thái PENDING.
   */
  async rejectJob(id: string, dto: RejectJobDto) {
    const job = await this.findJobById(id);

    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ có thể từ chối tin đang ở trạng thái PENDING (trạng thái hiện tại: ${job.status})`,
      );
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.REJECTED,
        rejectReason: dto.reason,
        approvedAt: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });
  }
}
