import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thông tin công ty mới (Dành cho Recruiter - UC13)' })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách công ty (phân trang, tìm kiếm)' })
  findAll(@Query() query: QueryCompaniesDto) {
    return this.companiesService.findAll(query);
  }

  @Get('my-company')
  @ApiOperation({ summary: 'Lấy thông tin công ty của recruiter hiện tại' })
  @ApiQuery({
    name: 'ownerId',
    required: true,
    description: 'ID của recruiter (tạm thời trước khi có Auth)',
  })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER)
  // TODO: Thay @Query bằng @CurrentUser() user: User sau khi có Auth
  findMyCompany(@Query('ownerId', ParseUUIDPipe) ownerId: string) {
    return this.companiesService.findByOwnerId(ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết công ty theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin công ty' })
  // TODO: @UseGuards(JwtAuthGuard, RolesGuard)
  // TODO: @Roles(Role.RECRUITER, Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }
}
