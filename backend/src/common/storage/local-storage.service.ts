import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import {
  StoredFile,
  StorageService,
  UploadedFileResult,
  UploadFileInput,
  UploadFileOptions,
} from './storage.interface';

@Injectable()
export class LocalStorageService extends StorageService implements OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseUploadDir: string;

  constructor(private readonly configService: ConfigService) {
    super();
    // Đọc đường dẫn từ biến môi trường STORAGE_DIR, mặc định là thư mục 'uploads' tại thư mục gốc backend
    const configuredDir = this.configService.get<string>('STORAGE_DIR', 'uploads');
    this.baseUploadDir = path.isAbsolute(configuredDir)
      ? configuredDir
      : path.resolve(process.cwd(), configuredDir);
  }

  /**
   * Khởi tạo và đảm bảo thư mục lưu trữ gốc tồn tại khi ứng dụng khởi động.
   */
  async onModuleInit(): Promise<void> {
    try {
      await fs.promises.mkdir(this.baseUploadDir, { recursive: true });
      this.logger.log(`Thư mục lưu trữ file sẵn sàng tại: ${this.baseUploadDir}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Không thể khởi tạo thư mục lưu trữ file: ${message}`);
    }
  }

  /**
   * Lấy đường dẫn tuyệt đối của file và kiểm tra an toàn chống tấn công Path Traversal.
   */
  getAbsolutePath(key: string): string {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('Mã định danh file (key) không hợp lệ');
    }

    if (key.includes('\0')) {
      throw new BadRequestException('Khóa file chứa ký tự không hợp lệ');
    }

    // Chuẩn hóa và giải quyết đường dẫn tuyệt đối
    const normalizedKey = key.replace(/\\/g, '/');
    const resolvedPath = path.resolve(this.baseUploadDir, normalizedKey);

    // Kiểm tra bảo mật: file bắt buộc phải nằm bên trong baseUploadDir
    const relative = path.relative(this.baseUploadDir, resolvedPath);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      resolvedPath === this.baseUploadDir
    ) {
      throw new BadRequestException('Đường dẫn file không hợp lệ hoặc chứa ký tự nguy hiểm');
    }

    return resolvedPath;
  }

  /**
   * Tải file lên ổ đĩa với tên file ngẫu nhiên (UUID) để tránh trùng lặp và lộ tên gốc.
   */
  async upload(file: UploadFileInput, options?: UploadFileOptions): Promise<UploadedFileResult> {
    if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Dữ liệu file không hợp lệ hoặc rỗng');
    }

    // Làm sạch và trích xuất phần mở rộng gốc của file
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const cleanExt = rawExt.replace(/[^a-z0-9.]/g, '');

    // Đặt tên file: Tùy chỉnh (nếu có) hoặc sinh ngẫu nhiên UUIDv4
    let filename: string;
    if (options?.customFilename) {
      const sanitized = path.basename(options.customFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
      filename = sanitized;
    } else {
      filename = `${randomUUID()}${cleanExt}`;
    }

    // Xử lý thư mục con (ví dụ: 'cvs', 'company-logos')
    let folder = '';
    if (options?.folder) {
      const sanitizedFolder = options.folder
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
        .trim();

      if (sanitizedFolder) {
        const testTarget = path.resolve(this.baseUploadDir, sanitizedFolder);
        const relative = path.relative(this.baseUploadDir, testTarget);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new BadRequestException('Thư mục con lưu trữ không hợp lệ');
        }
        folder = sanitizedFolder;
      }
    }

    const targetDir = folder ? path.join(this.baseUploadDir, folder) : this.baseUploadDir;

    try {
      await fs.promises.mkdir(targetDir, { recursive: true });
      const fullPath = path.join(targetDir, filename);

      await fs.promises.writeFile(fullPath, file.buffer);

      const key = folder ? `${folder}/${filename}` : filename;
      const size = typeof file.size === 'number' ? file.size : file.buffer.length;

      return {
        key,
        filename,
        path: fullPath,
        size,
        mimetype: file.mimetype,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Lỗi ghi file vào đĩa: ${message}`);
      throw new InternalServerErrorException(`Không thể lưu file lên máy chủ: ${message}`);
    }
  }

  /**
   * Lấy thông tin và Readable Stream của file để tải xuống.
   */
  async getFile(key: string): Promise<StoredFile> {
    const fullPath = this.getAbsolutePath(key);

    let stats: fs.Stats;
    try {
      stats = await fs.promises.stat(fullPath);
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        throw new NotFoundException(`File không tồn tại: ${key}`);
      }
      throw new InternalServerErrorException(`Lỗi khi kiểm tra file: ${nodeErr.message}`);
    }

    if (!stats.isFile()) {
      throw new NotFoundException(`Đường dẫn không phải là file: ${key}`);
    }

    const stream = fs.createReadStream(fullPath);

    return {
      stream,
      filename: path.basename(fullPath),
      filePath: fullPath,
      size: stats.size,
    };
  }

  /**
   * Lấy Readable Stream trực tiếp của file.
   */
  async getStream(key: string): Promise<Readable> {
    const storedFile = await this.getFile(key);
    return storedFile.stream;
  }

  /**
   * Lấy toàn bộ nội dung file dưới dạng Buffer.
   */
  async getBuffer(key: string): Promise<Buffer> {
    const fullPath = this.getAbsolutePath(key);

    try {
      return await fs.promises.readFile(fullPath);
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        throw new NotFoundException(`File không tồn tại: ${key}`);
      }
      throw new InternalServerErrorException(`Lỗi khi đọc file: ${nodeErr.message}`);
    }
  }

  /**
   * Kiểm tra sự tồn tại của file.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.getAbsolutePath(key);
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Xóa file khỏi ổ đĩa.
   */
  async delete(key: string): Promise<void> {
    const fullPath = this.getAbsolutePath(key);

    try {
      await fs.promises.unlink(fullPath);
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        throw new NotFoundException(`File không tồn tại để xóa: ${key}`);
      }
      throw new InternalServerErrorException(`Lỗi khi xóa file: ${nodeErr.message}`);
    }
  }
}
