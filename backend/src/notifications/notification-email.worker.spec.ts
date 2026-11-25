import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MailService } from './mail.service';
import { NotificationEmailWorker } from './notification-email.worker';

jest.mock('./mail.service', () => ({ MailService: class MailService {} }));

describe(NotificationEmailWorker.name, () => {
  const now = new Date('2026-11-13T03:00:00.000Z');
  const notification = {
    id: 'notification-id',
    type: 'INTERVIEW_SCHEDULED',
    payload: {
      jobTitle: 'Backend Developer',
      scheduledAt: '2026-11-16T04:00:00.000Z',
      location: 'Văn phòng',
    },
    user: { email: 'candidate@example.com', fullName: 'Ứng Viên' },
    emailAttempts: 0,
    emailNextAttemptAt: now,
  };

  const findMany = jest.fn();
  const updateMany = jest.fn();
  const send = jest.fn();
  const prisma = { notification: { findMany, updateMany } } as unknown as PrismaService;
  const mail = { send } as unknown as MailService;
  const worker = new NotificationEmailWorker(prisma, mail);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    findMany.mockResolvedValue([notification]);
    updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('claims a pending notification before sending and records delivery', async () => {
    await worker.deliverPending();

    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: notification.id,
        emailSentAt: null,
        emailAttempts: 0,
        emailNextAttemptAt: now,
      },
      data: { emailNextAttemptAt: new Date(now.getTime() + 300_000) },
    });
    expect(send).toHaveBeenCalledWith(
      notification.user.email,
      'Lịch phỏng vấn mới',
      expect.stringMatching(/04:00.*\(UTC\)/),
    );
    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: notification.id, emailNextAttemptAt: new Date(now.getTime() + 300_000) },
      data: { emailSentAt: now, emailNextAttemptAt: null },
    });
  });

  it('skips notifications already claimed by another worker', async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });

    await worker.deliverPending();

    expect(send).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, 30_000],
    [1, 120_000],
    [2, null],
  ])('handles an SMTP failure after %i previous failures', async (emailAttempts, delay) => {
    findMany.mockResolvedValueOnce([{ ...notification, emailAttempts }]);
    send.mockRejectedValueOnce(new Error('SMTP unavailable'));

    await worker.deliverPending();

    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: notification.id, emailNextAttemptAt: new Date(now.getTime() + 300_000) },
      data: {
        emailAttempts: emailAttempts + 1,
        emailNextAttemptAt: delay === null ? null : new Date(now.getTime() + delay),
      },
    });
  });
});
