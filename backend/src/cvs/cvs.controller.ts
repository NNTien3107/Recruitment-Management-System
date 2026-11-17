import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CvsService } from './cvs.service';
import { UpdateCvDto } from './dto/update-cv.dto';
import { UploadCvDto } from './dto/upload-cv.dto';

@ApiTags('cvs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cvs')
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  private getCandidateId(user: RequestUser | undefined): string {
    if (!user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }

    if (user.role !== Role.CANDIDATE) {
      throw new ForbiddenException('Chỉ ứng viên mới được thực hiện thao tác này');
    }

    return user.id;
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload file CV mới (PDF/DOCX <= 5MB) (UC08)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File CV (PDF hoặc DOCX)',
        },
        name: { type: 'string', description: 'Tên gợi nhớ của CV' },
        isDefault: { type: 'boolean', description: 'Đặt làm CV mặc định' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadCv(
    @CurrentUser() user: RequestUser | undefined,
    @UploadedFile()
    file: { buffer?: Buffer; originalname?: string; size?: number; mimetype?: string } | undefined,
    @Body() dto: UploadCvDto,
  ) {
    const candidateId = this.getCandidateId(user);
    return this.cvsService.upload(candidateId, file, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách CV của ứng viên đang đăng nhập (UC08)' })
  async findAll(@CurrentUser() user: RequestUser | undefined) {
    const candidateId = this.getCandidateId(user);
    return this.cvsService.findAll(candidateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin một CV' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser | undefined,
  ) {
    const candidateId = this.getCandidateId(user);
    return this.cvsService.findOne(id, candidateId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Tải xuống file CV với kiểm quyền bảo mật (UC08/UC17)' })
  async downloadCv(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser | undefined,
    @Res() res: Response,
  ) {
    if (!user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập để tải CV');
    }

    const { cv, storedFile } = await this.cvsService.getDownloadStream(id, user);

    const safeFilename = encodeURIComponent(cv.originalName);

    res.setHeader('Content-Type', cv.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
    );

    storedFile.stream.pipe(res);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Đặt một CV làm CV mặc định' })
  async setDefault(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser | undefined,
  ) {
    const candidateId = this.getCandidateId(user);
    return this.cvsService.setDefault(id, candidateId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tên hoặc trạng thái của CV' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser | undefined,
    @Body() dto: UpdateCvDto,
  ) {
    const candidateId = this.getCandidateId(user);
    return this.cvsService.update(id, candidateId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa CV khỏi hệ thống và ổ đĩa (UC08)' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser | undefined,
  ) {
    const candidateId = this.getCandidateId(user);
    return this.cvsService.delete(id, candidateId);
  }
}
