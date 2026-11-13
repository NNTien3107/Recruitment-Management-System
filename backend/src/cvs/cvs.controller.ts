import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { CvsService } from './cvs.service';
import { UpdateCvDto } from './dto/update-cv.dto';
import { UploadCvDto } from './dto/upload-cv.dto';

@ApiTags('cvs')
@Controller('cvs')
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Post('upload')
  @ApiOperation({ summary: 'Upload file CV mới (PDF/DOCX <= 5MB) (UC08)' })
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên (dùng tạm khi chưa có JwtAuthGuard)',
    required: false,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'File CV (PDF hoặc DOCX)' },
        name: { type: 'string', description: 'Tên gợi nhớ của CV' },
        isDefault: { type: 'boolean', description: 'Đặt làm CV mặc định' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(
    @CurrentUser('id') candidateId: string | undefined,
    @UploadedFile()
    file: { buffer?: Buffer; originalname?: string; size?: number; mimetype?: string } | undefined,
    @Body() dto: UploadCvDto,
  ) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để tải lên CV');
    }
    return this.cvsService.upload(candidateId, file, dto);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Get()
  @ApiOperation({ summary: 'Danh sách CV của ứng viên đang đăng nhập (UC08)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên',
    required: false,
  })
  async findAll(@CurrentUser('id') candidateId?: string) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để xem danh sách CV');
    }
    return this.cvsService.findAll(candidateId);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin một CV' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID người dùng',
    required: false,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') candidateId?: string) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    return this.cvsService.findOne(id, candidateId);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/download')
  @ApiOperation({ summary: 'Tải xuống file CV với kiểm quyền bảo mật (UC08/UC17)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID người dùng',
    required: false,
  })
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

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Patch(':id/default')
  @ApiOperation({ summary: 'Đặt một CV làm CV mặc định' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên',
    required: false,
  })
  async setDefault(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') candidateId?: string,
  ) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    return this.cvsService.setDefault(id, candidateId);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tên hoặc trạng thái của CV' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên',
    required: false,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') candidateId: string | undefined,
    @Body() dto: UpdateCvDto,
  ) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    return this.cvsService.update(id, candidateId, dto);
  }

  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.CANDIDATE)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa CV khỏi hệ thống và ổ đĩa (UC08)' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'ID ứng viên',
    required: false,
  })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') candidateId?: string) {
    if (!candidateId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    return this.cvsService.delete(id, candidateId);
  }
}
