import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
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
