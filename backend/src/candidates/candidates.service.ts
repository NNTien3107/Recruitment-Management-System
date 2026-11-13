import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin hồ sơ của ứng viên.
   * Nếu ứng viên chưa từng tạo hồ sơ, trả về thông tin người dùng kèm hồ sơ rỗng.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        candidateProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin ứng viên');
    }

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profile: user.candidateProfile ?? {
        id: null,
        phone: null,
        address: null,
        title: null,
        bio: null,
        skills: [],
        experience: [],
        education: [],
        avatarUrl: null,
      },
    };
  }

  /**
   * Cập nhật hồ sơ ứng viên (UC07).
   * Tạo mới nếu chưa có hoặc cập nhật nếu đã tồn tại (upsert).
   */
  async updateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    // Đảm bảo user tồn tại
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    // 1. Nếu có cập nhật họ tên, cập nhật bảng User
    if (dto.fullName && dto.fullName !== user.fullName) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fullName: dto.fullName },
      });
    }

    // 2. Chuẩn bị dữ liệu cập nhật cho CandidateProfile
    const profileData: Prisma.CandidateProfileUpdateInput = {
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.skills !== undefined && { skills: dto.skills }),
      ...(dto.experience !== undefined && {
        experience: dto.experience as unknown as Prisma.InputJsonValue,
      }),
      ...(dto.education !== undefined && {
        education: dto.education as unknown as Prisma.InputJsonValue,
      }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
    };

    const profileCreateData: Prisma.CandidateProfileCreateInput = {
      user: { connect: { id: userId } },
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      title: dto.title ?? null,
      bio: dto.bio ?? null,
      skills: dto.skills ?? [],
      experience: (dto.experience as unknown as Prisma.InputJsonValue) ?? [],
      education: (dto.education as unknown as Prisma.InputJsonValue) ?? [],
      avatarUrl: dto.avatarUrl ?? null,
    };

    // 3. Upsert CandidateProfile
    const updatedProfile = await this.prisma.candidateProfile.upsert({
      where: { userId },
      update: profileData,
      create: profileCreateData,
    });

    const refreshedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true },
    });

    return {
      userId,
      email: refreshedUser?.email,
      fullName: refreshedUser?.fullName,
      profile: updatedProfile,
    };
  }
}

