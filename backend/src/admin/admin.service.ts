import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma, Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { buildPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { userSelect } from '../users/users.service';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { RejectJobDto } from './dto/reject-job.dto';

export const adminUserSelect = {
  ...userSelect,
  company: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getDashboard() {
    const [userCount, jobCount] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.job.count({ where: { deletedAt: null } }),
    ]);

    // Applications will supply this count once its tables are available.
    return { userCount, jobCount, applicationCount: null };
  }

  /**
   * Danh sách người dùng dành cho Admin quản lý (UC21, FR-31)
   * Hỗ trợ lọc theo vai trò (CANDIDATE, RECRUITER, ADMIN), trạng thái khóa (isLocked) và tìm kiếm theo email/họ tên.
   */
  async findAllUsers(query: QueryAdminUsersDto) {
    const { page, pageSize, role, isLocked, keyword } = query;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(typeof isLocked === 'boolean' && { isLocked }),
      ...(keyword && {
        OR: [
          { email: { contains: keyword, mode: 'insensitive' } },
          { fullName: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Xem chi tiết thông tin người dùng dành cho Admin (UC21, FR-31)
   */
  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: adminUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  /**
   * Khóa tài khoản người dùng và thu hồi toàn bộ refresh token (UC22, FR-32, BR-06)
   */
  async lockUser(id: string) {
    const user = await this.findUserById(id);

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Không thể khóa tài khoản quản trị viên (ADMIN)');
    }

    if (user.isLocked) {
      throw new BadRequestException('Tài khoản này đã bị khóa trước đó');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isLocked: true },
      select: adminUserSelect,
    });

    // BR-06: Tài khoản bị khóa thì mọi refresh token bị vô hiệu ngay lập tức
    await this.authService.revokeAllUserTokens(id);

    return updatedUser;
  }

  /**
   * Mở khóa tài khoản người dùng (UC22, FR-32)
   */
  async unlockUser(id: string) {
    const user = await this.findUserById(id);

    if (!user.isLocked) {
      throw new BadRequestException('Tài khoản này đang hoạt động, không ở trạng thái bị khóa');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isLocked: false },
      select: adminUserSelect,
    });
  }

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
