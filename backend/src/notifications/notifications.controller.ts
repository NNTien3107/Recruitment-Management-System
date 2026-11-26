import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { NotificationService } from './notifications.service';

@ApiTags('candidate-notifications')
@Auth(Role.CANDIDATE)
@Controller('candidate/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Xem thông báo của ứng viên đang đăng nhập' })
  findMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.notifications.findMine(userId, query);
  }
}
