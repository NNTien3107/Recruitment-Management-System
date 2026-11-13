import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.interface';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let testUploadDir: string;

  beforeAll(async () => {
    testUploadDir = path.join(os.tmpdir(), `test-rms-storage-${Date.now()}`);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'STORAGE_DIR') return testUploadDir;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LocalStorageService>(LocalStorageService);
    await service.onModuleInit();
  });

  afterAll(async () => {
    try {
      await fs.promises.rm(testUploadDir, { recursive: true, force: true });
    } catch {
      // Bỏ qua nếu thư mục đã được dọn dẹp
    }
  });

  it('nên được định nghĩa và kế thừa StorageService', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(StorageService);
  });

  describe('onModuleInit', () => {
    it('tạo thư mục lưu trữ nếu chưa tồn tại', async () => {
      const exists = await Promise.resolve(fs.existsSync(testUploadDir));
      expect(exists).toBe(true);
    });
  });

  describe('upload', () => {
    it('upload file thành công với tên ngẫu nhiên và đúng định dạng', async () => {
      const fileData = {
        buffer: Buffer.from('Nội dung file CV mẫu'),
        originalname: 'UngVien_NguyenVanA.pdf',
        mimetype: 'application/pdf',
        size: 21,
      };

      const result = await service.upload(fileData);

      expect(result).toBeDefined();
      expect(result.key).toMatch(/\.pdf$/);
      expect(result.filename).toMatch(/^[0-9a-f-]{36}\.pdf$/); // Định dạng UUIDv4
      expect(result.size).toBe(21);
      expect(result.mimetype).toBe('application/pdf');

      // Kiểm tra file thực sự được ghi vào đĩa
      const fileExists = fs.existsSync(result.path);
      expect(fileExists).toBe(true);

      const content = await fs.promises.readFile(result.path, 'utf-8');
      expect(content).toBe('Nội dung file CV mẫu');
    });

    it('upload file vào thư mục con (folder) thành công', async () => {
      const fileData = {
        buffer: Buffer.from('Company Logo Data'),
        originalname: 'logo.png',
        mimetype: 'image/png',
      };

      const result = await service.upload(fileData, { folder: 'company-logos' });

      expect(result.key.startsWith('company-logos/')).toBe(true);
      expect(result.key).toMatch(/\.png$/);
      expect(fs.existsSync(result.path)).toBe(true);
    });

    it('báo lỗi BadRequestException khi buffer rỗng hoặc không hợp lệ', async () => {
      const invalidFile = {
        buffer: null as unknown as Buffer,
        originalname: 'test.pdf',
      };

      await expect(service.upload(invalidFile)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('báo lỗi BadRequestException khi folder chứa ký tự path traversal', async () => {
      const fileData = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
      };

      await expect(service.upload(fileData, { folder: '../danger-dir' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('hỗ trợ customFilename nếu được cung cấp và làm sạch tên file', async () => {
      const fileData = {
        buffer: Buffer.from('data'),
        originalname: 'sample.txt',
      };

      const result = await service.upload(fileData, {
        customFilename: 'custom_file_name.txt',
      });

      expect(result.filename).toBe('custom_file_name.txt');
      expect(fs.existsSync(result.path)).toBe(true);
    });
  });

  describe('getAbsolutePath', () => {
    it('trả về đường dẫn tuyệt đối cho key hợp lệ', () => {
      const key = 'cvs/my-cv.pdf';
      const absPath = service.getAbsolutePath(key);
      expect(absPath).toBe(path.resolve(testUploadDir, key));
    });

    it('báo lỗi BadRequestException khi key rỗng hoặc không phải chuỗi', () => {
      expect(() => service.getAbsolutePath('')).toThrow(BadRequestException);
      expect(() => service.getAbsolutePath(null as unknown as string)).toThrow(BadRequestException);
    });

    it('báo lỗi BadRequestException khi phát hiện Path Traversal (..)', () => {
      expect(() => service.getAbsolutePath('../secret.env')).toThrow(BadRequestException);
      expect(() => service.getAbsolutePath('cvs/../../etc/passwd')).toThrow(BadRequestException);
    });

    it('báo lỗi BadRequestException khi key chứa null byte', () => {
      expect(() => service.getAbsolutePath('cvs/file.pdf\0.exe')).toThrow(BadRequestException);
    });
  });

  describe('getFile & getStream', () => {
    let uploadedKey: string;

    beforeEach(async () => {
      const res = await service.upload({
        buffer: Buffer.from('Hello Stream Test'),
        originalname: 'stream-test.txt',
      });
      uploadedKey = res.key;
    });

    it('lấy StoredFile thành công khi file tồn tại', async () => {
      const stored = await service.getFile(uploadedKey);

      expect(stored).toBeDefined();
      expect(stored.filename).toBeDefined();
      expect(stored.size).toBe(Buffer.from('Hello Stream Test').length);
      expect(stored.stream).toBeDefined();
    });

    it('lấy Readable Stream trực tiếp qua getStream', async () => {
      const stream = await service.getStream(uploadedKey);
      expect(stream).toBeDefined();

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
      }
      const text = Buffer.concat(chunks).toString('utf-8');
      expect(text).toBe('Hello Stream Test');
    });

    it('báo lỗi NotFoundException khi file không tồn tại', async () => {
      await expect(service.getFile('non-existent-file.txt')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getBuffer', () => {
    it('đọc toàn bộ buffer của file tồn tại', async () => {
      const content = 'Buffer Content 12345';
      const res = await service.upload({
        buffer: Buffer.from(content),
        originalname: 'buffer.txt',
      });

      const buffer = await service.getBuffer(res.key);
      expect(buffer.toString('utf-8')).toBe(content);
    });

    it('báo lỗi NotFoundException khi đọc file không tồn tại', async () => {
      await expect(service.getBuffer('unknown-file.txt')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('exists', () => {
    it('trả về true nếu file tồn tại', async () => {
      const res = await service.upload({
        buffer: Buffer.from('Exists Check'),
        originalname: 'check.txt',
      });

      const exists = await service.exists(res.key);
      expect(exists).toBe(true);
    });

    it('trả về false nếu file không tồn tại', async () => {
      const exists = await service.exists('does-not-exist.pdf');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('xóa file thành công khi file tồn tại', async () => {
      const res = await service.upload({
        buffer: Buffer.from('File to delete'),
        originalname: 'delete-me.txt',
      });

      expect(await service.exists(res.key)).toBe(true);

      await service.delete(res.key);

      expect(await service.exists(res.key)).toBe(false);
    });

    it('báo lỗi NotFoundException khi xóa file không tồn tại', async () => {
      await expect(service.delete('file-not-found-to-delete.pdf')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
