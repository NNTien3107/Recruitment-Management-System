import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export const MAX_CV_SIZE = 5 * 1024 * 1024; // 5 MB

export interface ValidatedFileInfo {
  mimeType: string;
  extension: string;
}

/**
 * Kiểm tra tính hợp lệ của file CV:
 * - Kích thước tối đa 5MB.
 * - Kiểm tra chữ ký file nhị phân (Magic Bytes) tại backend:
 *   + PDF: bắt đầu bằng "%PDF-" (0x25 0x50 0x44 0x46 0x2D).
 *   + DOCX: cấu trúc Open Packaging ZIP bắt đầu bằng "PK\x03\x04" (0x50 0x4B 0x03 0x04).
 *   + DOC (Word cũ): bắt đầu bằng 0xD0 0xCF 0x11 0xE0 (OLE2 Compound File).
 * - Không phụ thuộc vào phần mở rộng do client tự đặt để chống giả mạo file độc hại.
 */
export function validateCvFile(file?: {
  buffer?: Buffer;
  originalname?: string;
  size?: number;
}): ValidatedFileInfo {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new BadRequestException('Vui lòng chọn file CV để tải lên');
  }

  const fileSize = file.size ?? file.buffer.length;
  if (fileSize > MAX_CV_SIZE) {
    throw new BadRequestException('Kích thước file CV không được vượt quá 5MB');
  }

  if (file.buffer.length < 5) {
    throw new BadRequestException('Nội dung file không hợp lệ hoặc bị hỏng');
  }

  const buffer = file.buffer;
  const ext = path.extname(file.originalname || '').toLowerCase();

  // 1. Kiểm tra Magic Bytes của PDF: "%PDF-"
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  if (isPdf) {
    return {
      mimeType: 'application/pdf',
      extension: '.pdf',
    };
  }

  // 2. Kiểm tra Magic Bytes của DOCX (PK\x03\x04 - ZIP archive)
  const isZip =
    buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;

  if (isZip && ext === '.docx') {
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx',
    };
  }

  // 3. Kiểm tra Magic Bytes của DOC (0xD0 0xCF 0x11 0xE0)
  const isLegacyDoc =
    buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

  if (isLegacyDoc && (ext === '.doc' || ext === '.docx')) {
    return {
      mimeType: 'application/msword',
      extension: '.doc',
    };
  }

  throw new BadRequestException(
    'Định dạng file không được hỗ trợ. Hệ thống chỉ chấp nhận file CV định dạng PDF hoặc Word (.docx, .doc)',
  );
}
