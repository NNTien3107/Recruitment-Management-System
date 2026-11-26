import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Auth(Role.RECRUITER, Role.ADMIN)
  @ApiOperation({ summary: 'Tạo thông tin công ty mới (Dành cho Recruiter - UC13)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCompanyDto) {
    const ownerId = user.role === Role.ADMIN && dto.ownerId ? dto.ownerId : user.id;
    return this.companiesService.create({ ...dto, ownerId });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách công ty (phân trang, tìm kiếm)' })
  findAll(@Query() query: QueryCompaniesDto) {
    return this.companiesService.findAll(query);
  }

  @Get('my-company')
  @Auth(Role.RECRUITER, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy thông tin công ty của recruiter hiện tại' })
  findMyCompany(@CurrentUser() user: AuthUser, @Query('ownerId') ownerId?: string) {
    const targetOwnerId = user.role === Role.ADMIN && ownerId ? ownerId : user.id;
    return this.companiesService.findByOwnerId(targetOwnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết công ty theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.RECRUITER, Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin công ty' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, dto, user);
  }
}
