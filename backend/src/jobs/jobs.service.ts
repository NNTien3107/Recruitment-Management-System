import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { buildPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo tin tuyển dụng mới (UC14, BR-04)
   * BR-04: Recruiter phải có thông tin công ty trước khi đăng tin.
   */
  async create(dto: CreateJobDto) {
    // 1. Kiểm tra Recruiter đã có công ty chưa (BR-04)
    const company = await this.prisma.company.findUnique({
      where: { ownerId: dto.recruiterId },
    });

    if (!company) {
      throw new BadRequestException(
        'Nhà tuyển dụng phải tạo thông tin công ty trước khi đăng tin tuyển dụng (BR-04)',
      );
    }

    // 2. Kiểm tra khoảng lương hợp lệ
    if (dto.salaryMin != null && dto.salaryMax != null && dto.salaryMin > dto.salaryMax) {
      throw new BadRequestException('Mức lương tối thiểu không được lớn hơn mức lương tối đa');
    }

    return this.prisma.job.create({
      data: {
        companyId: company.id,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        benefits: dto.benefits,
        location: dto.location,
        skills: dto.skills,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        jobType: dto.jobType,
        level: dto.level,
        status: dto.status ?? JobStatus.DRAFT,
        deadline: dto.deadline,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
          },
        },
      },
    });
  }

  /**
   * Danh sách tin tuyển dụng công khai cho ứng viên/khách (UC05)
   * Chỉ hiển thị tin đã APPROVED và chưa bị xóa mềm (deletedAt == null).
   */
  async findAllPublic(query: QueryJobsDto) {
    const { page, pageSize, keyword, location, jobType, level, companyId, salaryMin, salaryMax } =
      query;

    const where: Prisma.JobWhereInput = {
      status: JobStatus.APPROVED,
      deletedAt: null,
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(jobType && { jobType }),
      ...(level && { level }),
      ...(companyId && { companyId }),
      ...(salaryMin != null && {
        salaryMax: { gte: salaryMin },
      }),
      ...(salaryMax != null && {
        salaryMin: { lte: salaryMax },
      }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
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
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Danh sách tin tuyển dụng của công ty thuộc về Recruiter (Quản lý tin tuyển dụng)
   */
  async findAllByRecruiter(recruiterId: string, query: QueryJobsDto) {
    const company = await this.prisma.company.findUnique({ where: { ownerId: recruiterId } });
    if (!company) {
      throw new NotFoundException('Không tìm thấy thông tin công ty của bạn');
    }

    const { page, pageSize, status, keyword } = query;
    const where: Prisma.JobWhereInput = {
      companyId: company.id,
      deletedAt: null,
      ...(status && { status }),
      ...(keyword && {
        title: { contains: keyword, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Chi tiết tin tuyển dụng (UC06)
   */
  async findOne(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            website: true,
            address: true,
            size: true,
            industry: true,
            ownerId: true,
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
   * Cập nhật tin tuyển dụng (UC14, BR-08, Quyền sở hữu)
   * BR-08: Sửa nội dung quan trọng của tin đã APPROVED thì quay về PENDING để duyệt lại.
   */
  async update(id: string, recruiterId: string, dto: UpdateJobDto) {
    const job = await this.findOne(id);

    // Kiểm tra quyền sở hữu: chỉ chủ sở hữu công ty mới được sửa tin
    if (job.company.ownerId !== recruiterId) {
      throw new ForbiddenException('Bạn chỉ có quyền chỉnh sửa tin tuyển dụng của công ty mình');
    }

    // Kiểm tra lương hợp lệ nếu có cập nhật
    const nextMin = dto.salaryMin !== undefined ? dto.salaryMin : job.salaryMin;
    const nextMax = dto.salaryMax !== undefined ? dto.salaryMax : job.salaryMax;
    if (nextMin != null && nextMax != null && nextMin > nextMax) {
      throw new BadRequestException('Mức lương tối thiểu không được lớn hơn mức lương tối đa');
    }

    // BR-08: Kiểm tra sửa nội dung quan trọng khi tin đã APPROVED
    const importantFields: (keyof UpdateJobDto)[] = [
      'title',
      'description',
      'requirements',
      'benefits',
      'location',
      'skills',
      'salaryMin',
      'salaryMax',
      'jobType',
      'level',
    ];
    const isEditingImportant = importantFields.some((field) => dto[field] !== undefined);

    let nextStatus = dto.status;
    let approvedAt = job.approvedAt;

    if (job.status === JobStatus.APPROVED && isEditingImportant) {
      nextStatus = JobStatus.PENDING; // Tự động quay về PENDING chờ Admin duyệt lại
      approvedAt = null;
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        ...dto,
        ...(nextStatus !== undefined && { status: nextStatus }),
        approvedAt,
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
   * Đóng tin tuyển dụng (UC15, Quyền sở hữu)
   */
  async close(id: string, recruiterId: string) {
    const job = await this.findOne(id);

    if (job.company.ownerId !== recruiterId) {
      throw new ForbiddenException('Bạn chỉ có quyền đóng tin tuyển dụng của công ty mình');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CLOSED,
        closedAt: new Date(),
      },
    });
  }

  /**
   * Xóa tin tuyển dụng (UC14, BR-05, Quyền sở hữu)
   * BR-05: Không xóa cứng tin đã có đơn ứng tuyển -> Soft delete bằng cột deletedAt.
   */
  async remove(id: string, recruiterId: string) {
    const job = await this.findOne(id);

    if (job.company.ownerId !== recruiterId) {
      throw new ForbiddenException('Bạn chỉ có quyền xóa tin tuyển dụng của công ty mình');
    }

    // Xóa mềm: đánh dấu deletedAt và chuyển sang CLOSED
    return this.prisma.job.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: JobStatus.CLOSED,
      },
    });
  }
}
