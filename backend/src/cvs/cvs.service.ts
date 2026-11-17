import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StorageService } from '../common/storage';
import { validateCvFile } from '../common/validators/file-signature.validator';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCvDto } from './dto/update-cv.dto';
import { UploadCvDto } from './dto/upload-cv.dto';

export const cvSelect = {
  id: true,
  candidateId: true,
  name: true,
  fileKey: true,
  originalName: true,
  mimeType: true,
  fileSize: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class CvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async upload(
    candidateId: string,
    file?: { buffer?: Buffer; originalname?: string; size?: number; mimetype?: string },
    dto?: UploadCvDto,
  ) {
    if (!candidateId) {
      throw new BadRequestException('ID ứng viên không hợp lệ');
    }

    const validated = validateCvFile(file);

    const uploadResult = await this.storageService.upload(
      {
        buffer: file!.buffer!,
        originalname: file!.originalname || `cv${validated.extension}`,
        mimetype: validated.mimeType,
        size: file!.buffer!.length,
      },
      { folder: 'cvs' },
    );

    try {
      const cvName =
        dto?.name?.trim() || file!.originalname || `CV ${new Date().toLocaleDateString()}`;

      return await this.prisma.$transaction(async (tx) => {
        const existingCvsCount = await tx.cv.count({
          where: { candidateId },
        });

        const shouldBeDefault = dto?.isDefault === true || existingCvsCount === 0;

        if (shouldBeDefault) {
          await tx.cv.updateMany({
            where: { candidateId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.cv.create({
          data: {
            candidateId,
            name: cvName,
            fileKey: uploadResult.key,
            originalName: file!.originalname || uploadResult.filename,
            mimeType: validated.mimeType,
            fileSize: uploadResult.size,
            isDefault: shouldBeDefault,
          },
          select: cvSelect,
        });
      });
    } catch (error) {
      await this.storageService.delete(uploadResult.key).catch(() => undefined);
      throw error;
    }
  }

  async findAll(candidateId: string) {
    return this.prisma.cv.findMany({
      where: { candidateId },
      select: cvSelect,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, candidateId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      select: cvSelect,
    });

    if (!cv) {
      throw new NotFoundException('Không tìm thấy thông tin CV');
    }

    if (cv.candidateId !== candidateId) {
      throw new ForbiddenException('Bạn không có quyền truy cập CV này');
    }

    return cv;
  }

  async getDownloadStream(id: string, requester: { id: string; role?: string }) {
    const cv = await this.prisma.cv.findUnique({ where: { id } });

    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV');
    }

    const isOwner = cv.candidateId === requester.id;
    const isAdmin = requester.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      if (requester.role === 'RECRUITER') {
        const hasApplied = await this.prisma.application.findFirst({
          where: {
            cvId: cv.id,
            job: { company: { ownerId: requester.id } },
          },
        });

        if (!hasApplied) {
          throw new ForbiddenException('Bạn không có quyền tải xuống CV này');
        }
      } else {
        throw new ForbiddenException('Bạn không có quyền tải xuống CV này');
      }
    }

    const storedFile = await this.storageService.getFile(cv.fileKey);

    return { cv, storedFile };
  }

  async update(id: string, candidateId: string, dto: UpdateCvDto) {
    await this.findOne(id, candidateId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.cv.updateMany({
          where: { candidateId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.cv.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
        select: cvSelect,
      });
    });
  }

  async setDefault(id: string, candidateId: string) {
    return this.update(id, candidateId, { isDefault: true });
  }

  async delete(id: string, candidateId: string) {
    const cv = await this.findOne(id, candidateId);

    const activeApplicationsCount = await this.prisma.application.count({
      where: { cvId: id },
    });

    if (activeApplicationsCount > 0) {
      throw new BadRequestException('Không thể xóa CV này vì đã được sử dụng trong đơn ứng tuyển');
    }

    await this.prisma.cv.delete({ where: { id } });

    try {
      await this.storageService.delete(cv.fileKey);
    } catch {
      // Bản ghi đã xóa; lỗi xóa file vật lý cần được xử lý riêng.
    }

    return { message: 'Đã xóa CV thành công' };
  }
}
