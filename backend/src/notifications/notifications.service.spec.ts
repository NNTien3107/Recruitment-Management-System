import type { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notifications.service';

describe('NotificationService.findMine', () => {
  it('scopes both rows and count to the candidate and selects only display fields', async () => {
    const row = {
      id: 'notification-2',
      type: 'APPLICATION_STATUS_CHANGED',
      payload: { jobTitle: 'Developer', previousStatus: 'APPLIED', status: 'REVIEWING' },
      createdAt: new Date('2026-11-27T02:00:00Z'),
    };

    const findMany = jest.fn().mockResolvedValue([row]);
    const count = jest.fn().mockResolvedValue(2);
    const prisma = {
      notification: { findMany, count },
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    } as unknown as PrismaService;

    const result = await new NotificationService(prisma).findMine('current-candidate', {
      page: 2,
      pageSize: 1,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'current-candidate' },
      select: { id: true, type: true, payload: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 1,
      take: 1,
    });
    expect(count).toHaveBeenCalledWith({ where: { userId: 'current-candidate' } });
    expect(result).toEqual({
      items: [row],
      meta: { page: 2, pageSize: 1, total: 2, totalPages: 2 },
    });
  });
});
