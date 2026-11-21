import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { buildPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    // 1. Kiểm tra tài khoản người sở hữu
    const owner = await this.prisma.user.findUnique({ where: { id: dto.ownerId } });
    if (!owner) {
      throw new NotFoundException('Không tìm thấy tài khoản người sở hữu');
    }

    if (owner.role !== Role.RECRUITER && owner.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ tài khoản Recruiter mới có thể tạo công ty');
    }

    // 2. Ràng buộc 1-1: Mỗi recruiter chỉ sở hữu tối đa 1 công ty (UC13)
    const existing = await this.prisma.company.findUnique({ where: { ownerId: dto.ownerId } });
    if (existing) {
      throw new ConflictException('Mỗi nhà tuyển dụng chỉ được sở hữu một công ty');
    }

    return this.prisma.company.create({
      data: {
        ownerId: dto.ownerId,
        name: dto.name,
        description: dto.description,
        website: dto.website,
        logoUrl: dto.logoUrl,
        address: dto.address,
        industry: dto.industry,
        size: dto.size,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryCompaniesDto) {
    const { page, pageSize, keyword, industry, size } = query;

    const where: Prisma.CompanyWhereInput = {
      ...(industry && { industry: { equals: industry, mode: 'insensitive' } }),
      ...(size && { size: { equals: size, mode: 'insensitive' } }),
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { address: { contains: keyword, mode: 'insensitive' } },
          { industry: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              jobs: {
                where: {
                  status: 'APPROVED',
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return buildPaginated(items, total, page, pageSize);
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        jobs: {
          where: {
            status: 'APPROVED',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Không tìm thấy thông tin công ty');
    }

    return company;
  }

  async findByOwnerId(ownerId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId },
      include: {
        jobs: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Tài khoản này chưa tạo thông tin công ty');
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }
}
