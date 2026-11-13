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

  /**
   * Tải lên và lưu trữ CV ứng viên (UC08).
   * - Xác thực chữ ký nhị phân (PDF/DOCX <= 5MB) tại backend.
   * - Lưu trữ file an toàn qua StorageService với tên ngẫu nhiên (UUID).
   * - Quản lý trạng thái CV mặc định.
   */
  async upload(
    candidateId: string,
    file?: { buffer?: Buffer; originalname?: string; size?: number; mimetype?: string },
    dto?: UploadCvDto,
  ) {
    if (!candidateId) {
      throw new BadRequestException('ID ứng viên không hợp lệ');
    }

    // 1. Kiểm tra tính hợp lệ của file (Magic Bytes & kích thước <= 5MB)
    const validated = validateCvFile(file);

    // 2. Tải file lên storage vào thư mục con 'cvs'
    const uploadResult = await this.storageService.upload(
      {
        buffer: file!.buffer!,
        originalname: file!.originalname || `cv${validated.extension}`,
        mimetype: validated.mimeType,
        size: file!.size ?? file!.buffer!.length,
      },
      { folder: 'cvs' },
    );

    // 3. Xử lý CV mặc định:
    // Nếu là CV đầu tiên của ứng viên, tự động đặt làm mặc định
    const existingCvsCount = await this.prisma.cv.count({
      where: { candidateId },
    });
    const shouldBeDefault = dto?.isDefault || existingCvsCount === 0;

    // 4. Nếu đặt làm mặc định, hủy cờ isDefault của các CV khác
    if (shouldBeDefault && existingCvsCount > 0) {
      await this.prisma.cv.updateMany({
        where: { candidateId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const cvName =
      dto?.name?.trim() || file!.originalname || `CV ${new Date().toLocaleDateString()}`;

    // 5. Lưu thông tin CV vào Database
    return this.prisma.cv.create({
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
  }

  /**
   * Lấy danh sách toàn bộ CV của một ứng viên.
   */
  async findAll(candidateId: string) {
    return this.prisma.cv.findMany({
      where: { candidateId },
      select: cvSelect,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Xem thông tin chi tiết một CV (chỉ chủ sở hữu).
   */
  async findOne(id: string, candidateId?: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      select: cvSelect,
    });

    if (!cv) {
      throw new NotFoundException('Không tìm thấy thông tin CV');
    }

    if (candidateId && cv.candidateId !== candidateId) {
      throw new ForbiddenException('Bạn không có quyền truy cập CV này');
    }

    return cv;
  }

  /**
   * Tải xuống file CV với cơ chế kiểm tra quyền truy cập chặt chẽ (UC08 / UC17):
   * - Chỉ chủ sở hữu CV (Candidate) hoặc Recruiter quản lý tin mà ứng viên đã ứng tuyển mới được tải.
   */
  async getDownloadStream(id: string, requester: { id: string; role?: string }) {
    const cv = await this.prisma.cv.findUnique({ where: { id } });

    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV');
    }

    const isOwner = cv.candidateId === requester.id;
    const isAdmin = requester.role === 'ADMIN';

    // Nếu không phải chủ sở hữu hoặc Admin, kiểm tra xem có phải Recruiter liên quan không
    if (!isOwner && !isAdmin) {
      if (requester.role === 'RECRUITER') {
        const hasApplied = await this.prisma.application.findFirst({
          where: {
            cvId: cv.id,
            job: { recruiterId: requester.id },
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

    return {
      cv,
      storedFile,
    };
  }

  /**
   * Cập nhật thông tin CV (tên, cờ mặc định).
   */
  async update(id: string, candidateId: string, dto: UpdateCvDto) {
    await this.findOne(id, candidateId);

    if (dto.isDefault) {
      await this.prisma.cv.updateMany({
        where: { candidateId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.cv.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
      select: cvSelect,
    });
  }

  /**
   * Đặt một CV làm mặc định.
   */
  async setDefault(id: string, candidateId: string) {
    return this.update(id, candidateId, { isDefault: true });
  }

  /**
   * Xóa file CV: Xóa file vật lý qua StorageService và xóa bản ghi DB.
   */
  async delete(id: string, candidateId: string) {
    const cv = await this.findOne(id, candidateId);

    // Kiểm tra xem CV đã được sử dụng trong đơn ứng tuyển nào chưa
    const activeApplicationsCount = await this.prisma.application.count({
      where: { cvId: id },
    });
    if (activeApplicationsCount > 0) {
      throw new BadRequestException(
        'Không thể xóa CV này vì đã được sử dụng trong đơn ứng tuyển',
      );
    }

    // 1. Xóa file khỏi ổ đĩa
    try {
      await this.storageService.delete(cv.fileKey);
    } catch {
      // Tiếp tục xóa bản ghi DB ngay cả khi file vật lý đã không còn trên đĩa
    }

    // 2. Xóa bản ghi trong database
    await this.prisma.cv.delete({ where: { id } });

    return { message: 'Đã xóa CV thành công' };
  }
}

