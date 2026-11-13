import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { StorageService } from '../common/storage';
import { PrismaService } from '../prisma/prisma.service';
import { CvsService } from './cvs.service';

describe('CvsService', () => {
  let service: CvsService;

  const mockPrisma = {
    cv: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    application: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockStorageService = {
    upload: jest.fn(),
    getFile: jest.fn(),
    delete: jest.fn(),
  };

  const createMockFile = (
    buffer: Buffer,
    originalname: string,
    mimetype = 'application/octet-stream',
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    buffer,
    stream: new Readable(),
    destination: '',
    filename: '',
    path: '',
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.application.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<CvsService>(CvsService);
  });

  describe('upload', () => {
    it('upload CV file PDF hợp lệ thành công (chữ ký %PDF-)', async () => {
      // Buffer bắt đầu bằng chữ ký nhị phân %PDF-
      const validPdfBuffer = Buffer.from('%PDF-1.4 sample content');
      const mockFile = createMockFile(validPdfBuffer, 'NguyenVanA_Resume.pdf');

      mockStorageService.upload.mockResolvedValue({
        key: 'cvs/uuid-123.pdf',
        filename: 'uuid-123.pdf',
        path: '/uploads/cvs/uuid-123.pdf',
        size: validPdfBuffer.length,
      });

      mockPrisma.cv.count.mockResolvedValue(0); // CV đầu tiên
      mockPrisma.cv.create.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'cand-1',
        name: 'NguyenVanA_Resume.pdf',
        fileKey: 'cvs/uuid-123.pdf',
        mimeType: 'application/pdf',
        isDefault: true,
      });

      const result = await service.upload('cand-1', mockFile);

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ mimetype: 'application/pdf' }),
        { folder: 'cvs' },
      );
      expect(mockPrisma.cv.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isDefault: true,
          mimeType: 'application/pdf',
        }),
        select: expect.any(Object) as Record<string, boolean>,
      });
      expect(result.id).toBe('cv-1');
    });

    it('upload CV file DOCX hợp lệ thành công (chữ ký PK\x03\x04)', async () => {
      // Buffer bắt đầu bằng chữ ký nhị phân PK\x03\x04 (ZIP)
      const validDocxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      const mockFile = createMockFile(validDocxBuffer, 'my-resume.docx');

      mockStorageService.upload.mockResolvedValue({
        key: 'cvs/uuid-docx.docx',
        filename: 'uuid-docx.docx',
        path: '/uploads/cvs/uuid-docx.docx',
        size: validDocxBuffer.length,
      });

      mockPrisma.cv.count.mockResolvedValue(1);
      mockPrisma.cv.create.mockResolvedValue({
        id: 'cv-docx',
        candidateId: 'cand-1',
        name: 'my-resume.docx',
        fileKey: 'cvs/uuid-docx.docx',
        isDefault: false,
      });

      const result = await service.upload('cand-1', mockFile);

      expect(result.id).toBe('cv-docx');
    });

    it('từ chối file giả mạo đuôi extension có nội dung không phải PDF/DOCX', async () => {
      // File text giả mạo đuôi .pdf
      const fakeFile = createMockFile(
        Buffer.from('Plain text content masquerading as PDF'),
        'fake.pdf',
      );

      await expect(service.upload('cand-1', fakeFile)).rejects.toBeInstanceOf(BadRequestException);
      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    it('từ chối file vượt quá kích thước tối đa 5MB', async () => {
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      oversizedBuffer.write('%PDF-', 0);

      const largeFile = createMockFile(oversizedBuffer, 'huge.pdf');

      await expect(service.upload('cand-1', largeFile)).rejects.toThrow(
        'Kích thước file CV không được vượt quá 5MB',
      );
      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });
  });

  describe('getDownloadStream', () => {
    it('cho phép chủ sở hữu CV tải file', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'user-cand',
        fileKey: 'cvs/test.pdf',
        originalName: 'cv.pdf',
      });

      mockStorageService.getFile.mockResolvedValue({
        stream: new Readable(),
        filename: 'test.pdf',
        filePath: '/uploads/cvs/test.pdf',
        size: 100,
      });

      const result = await service.getDownloadStream('cv-1', {
        id: 'user-cand',
        role: 'CANDIDATE',
      });

      expect(result.cv.id).toBe('cv-1');
      expect(mockStorageService.getFile).toHaveBeenCalledWith('cvs/test.pdf');
    });

    it('từ chối khi người dùng khác không có thẩm quyền cố tải CV', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'user-cand',
        fileKey: 'cvs/test.pdf',
      });

      await expect(
        service.getDownloadStream('cv-1', {
          id: 'other-user',
          role: 'CANDIDATE',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(mockStorageService.getFile).not.toHaveBeenCalled();
    });

    it('báo lỗi NotFoundException khi CV không tồn tại', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue(null);

      await expect(service.getDownloadStream('unknown-cv', { id: 'u-1' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('xóa file khỏi ổ đĩa và xóa bản ghi DB', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'cand-1',
        fileKey: 'cvs/file-to-delete.pdf',
      });
      mockPrisma.application.count.mockResolvedValue(0);

      await service.delete('cv-1', 'cand-1');

      expect(mockStorageService.delete).toHaveBeenCalledWith('cvs/file-to-delete.pdf');
      expect(mockPrisma.cv.delete).toHaveBeenCalledWith({ where: { id: 'cv-1' } });
    });

    it('từ chối xóa nếu CV đã được sử dụng trong đơn ứng tuyển', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'cand-1',
      });
      mockPrisma.application.count.mockResolvedValue(2); // Có 2 đơn nộp

      await expect(service.delete('cv-1', 'cand-1')).rejects.toThrow(
        'Không thể xóa CV này vì đã được sử dụng trong đơn ứng tuyển',
      );
      expect(mockStorageService.delete).not.toHaveBeenCalled();
      expect(mockPrisma.cv.delete).not.toHaveBeenCalled();
    });

    it('từ chối xóa nếu không phải chủ sở hữu CV', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-1',
        candidateId: 'cand-1',
      });

      await expect(service.delete('cv-1', 'other-cand')).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockStorageService.delete).not.toHaveBeenCalled();
      expect(mockPrisma.cv.delete).not.toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('cập nhật CV thành mặc định và bỏ cờ mặc định của CV cũ', async () => {
      mockPrisma.cv.findUnique.mockResolvedValue({
        id: 'cv-2',
        candidateId: 'cand-1',
        isDefault: false,
      });

      await service.setDefault('cv-2', 'cand-1');

      expect(mockPrisma.cv.updateMany).toHaveBeenCalledWith({
        where: { candidateId: 'cand-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrisma.cv.update).toHaveBeenCalledWith({
        where: { id: 'cv-2' },
        data: { isDefault: true },
        select: expect.any(Object) as Record<string, boolean>,
      });
    });
  });
});