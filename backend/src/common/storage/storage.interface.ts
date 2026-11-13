import { Readable } from 'stream';

export interface UploadFileOptions {
  /**
   * Thư mục con để phân loại file (ví dụ: 'cvs', 'company-logos', 'avatars').
   * Nếu không cung cấp, file được lưu trực tiếp vào thư mục gốc uploads.
   */
  folder?: string;

  /**
   * Tên file tùy chỉnh nếu muốn chỉ định trước.
   * Nếu không cung cấp, hệ thống tự động sinh tên file ngẫu nhiên (UUIDv4 + phần mở rộng gốc).
   */
  customFilename?: string;
}

export interface UploadFileInput {
  /** Buffer dữ liệu của file */
  buffer: Buffer;

  /** Tên gốc của file do client gửi lên (ví dụ: 'NguyenVanA_CV.pdf') */
  originalname: string;

  /** Kiểu MIME của file (ví dụ: 'application/pdf', 'image/png') */
  mimetype?: string;

  /** Kích thước file (bytes) */
  size?: number;
}

export interface UploadedFileResult {
  /**
   * Khóa / đường dẫn tương đối dùng để định danh và truy xuất file (ví dụ: 'cvs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.pdf').
   * Đây là giá trị lưu vào cơ sở dữ liệu.
   */
  key: string;

  /** Tên file ngẫu nhiên đã được lưu trên máy chủ (ví dụ: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.pdf') */
  filename: string;

  /** Đường dẫn tuyệt đối của file trên ổ đĩa máy chủ */
  path: string;

  /** Kích thước file theo bytes */
  size: number;

  /** Kiểu MIME của file nếu có */
  mimetype?: string;
}

export interface StoredFile {
  /** Stream đọc dữ liệu file, thích hợp để pipe trực tiếp ra HTTP Response khi tải xuống */
  stream: Readable;

  /** Tên file trên hệ thống */
  filename: string;

  /** Đường dẫn tuyệt đối của file trên đĩa */
  filePath: string;

  /** Kích thước file (bytes) */
  size: number;

  /** Kiểu MIME suy ra từ extension hoặc thông tin lưu trữ */
  mimetype?: string;
}

/**
 * StorageService trừu tượng (Abstract Class).
 * Đóng vai trò là Interface hợp đồng và đồng thời là NestJS Dependency Injection Token.
 * Cho phép các module inject trực tiếp qua `StorageService` và dễ dàng hoán đổi
 * implementation (LocalStorageService, S3StorageService, R2StorageService...) trong tương lai.
 */
export abstract class StorageService {
  /**
   * Tải file lên bộ lưu trữ.
   * File được đổi tên ngẫu nhiên bằng UUID và lưu an toàn ngoài thư mục public.
   */
  abstract upload(
    file: UploadFileInput,
    options?: UploadFileOptions,
  ): Promise<UploadedFileResult>;

  /**
   * Lấy thông tin và Readable Stream của file để tải xuống.
   * Ném NotFoundException nếu file không tồn tại.
   */
  abstract getFile(key: string): Promise<StoredFile>;

  /**
   * Lấy Readable Stream trực tiếp của file.
   * Ném NotFoundException nếu file không tồn tại.
   */
  abstract getStream(key: string): Promise<Readable>;

  /**
   * Lấy toàn bộ nội dung file dưới dạng Buffer trong bộ nhớ.
   * Ném NotFoundException nếu file không tồn tại.
   */
  abstract getBuffer(key: string): Promise<Buffer>;

  /**
   * Kiểm tra xem file có tồn tại trên hệ thống hay không.
   */
  abstract exists(key: string): Promise<boolean>;

  /**
   * Xóa file khỏi bộ lưu trữ.
   * Ném NotFoundException nếu file không tồn tại.
   */
  abstract delete(key: string): Promise<void>;

  /**
   * Lấy đường dẫn tuyệt đối của file sau khi kiểm tra tính an toàn (chống Directory Traversal).
   */
  abstract getAbsolutePath(key: string): string;
}

