import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
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

  async updateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy thông tin người dùng');
      }

      if (dto.fullName !== undefined && dto.fullName !== user.fullName) {
        await tx.user.update({
          where: { id: userId },
          data: { fullName: dto.fullName },
        });
      }

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
        experience:
          (dto.experience as unknown as Prisma.InputJsonValue) ?? [],
        education:
          (dto.education as unknown as Prisma.InputJsonValue) ?? [],
        avatarUrl: dto.avatarUrl ?? null,
      };

      const updatedProfile = await tx.candidateProfile.upsert({
        where: { userId },
        update: profileData,
        create: profileCreateData,
      });

      const refreshedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      });

      return {
        userId,
        email: refreshedUser?.email,
        fullName: refreshedUser?.fullName,
        profile: updatedProfile,
      };
    });
  }
}
