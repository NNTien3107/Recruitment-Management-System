import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEvent, NotificationEvents } from './notification-events';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(...[userId, type, payload, tx]: NotificationArguments): Promise<void> {
    await (tx ?? this.prisma).notification.create({
      data: { userId, type, payload: payload satisfies Prisma.InputJsonObject },
      select: { id: true },
    });
  }

  async findMine(userId: string, { page, pageSize }: PaginationQueryDto) {
    const where = { userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: { id: true, type: true, payload: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginated(rows, total, page, pageSize);
  }
}

type NotificationArguments = {
  [Type in keyof NotificationEvents]: [
    userId: string,
    type: Type & NotificationType,
    payload: NotificationEvents[Type],
    tx?: Prisma.TransactionClient,
  ];
}[keyof NotificationEvents];

// Rows are written only through notify, which validates the type/payload pairing at compile time.
export function readNotificationEvent(type: NotificationType, payload: Prisma.JsonValue) {
  return { type, payload } as NotificationEvent;
}
