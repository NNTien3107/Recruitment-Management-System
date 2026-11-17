import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export const MAX_CV_SIZE = 5 * 1024 * 1024; // 5 MB

export interface ValidatedFileInfo {
  mimeType: string;
  extension: string;
}

export function validateCvFile(file?: {
  buffer?: Buffer;
  originalname?: string;
  size?: number;
}): ValidatedFileInfo {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new BadRequestException('Vui lòng chọn file CV để tải lên');
  }

  const buffer = file.buffer;
  const ext = path.extname(file.originalname || '').toLowerCase();

  // Kiểm tra dung lượng thực tế, không tin kích thước client gửi lên
  if (buffer.length > MAX_CV_SIZE) {
    throw new BadRequestException('Kích thước file CV không được vượt quá 5MB');
  }

  if (buffer.length < 5) {
    throw new BadRequestException('Nội dung file không hợp lệ hoặc bị hỏng');
  }

  // PDF
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

  // DOCX (ZIP signature)
  const isZip =
    buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;

  if (isZip && ext === '.docx') {
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx',
    };
  }

  // DOC cũ (OLE2 signature)
  const isLegacyDoc =
    buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

  if (isLegacyDoc && ext === '.doc') {
    return {
      mimeType: 'application/msword',
      extension: '.doc',
    };
  }

  throw new BadRequestException(
    'Định dạng file không được hỗ trợ. Hệ thống chỉ chấp nhận file CV định dạng PDF hoặc Word (.docx, .doc)',
  );
}
