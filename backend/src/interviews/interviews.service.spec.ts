import { ApplicationStatus } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewsService } from './interviews.service';

describe(InterviewsService.name, () => {
  const scheduledAt = '2035-06-01T15:00:00+07:00';
  const dto = { scheduledAt, location: 'Văn phòng' };
  const application = {
    candidateId: 'candidate',
    status: ApplicationStatus.REVIEWING,
    job: { title: 'Developer', company: { ownerId: 'recruiter' } },
  };
  const findUnique = jest.fn();
  const create = jest.fn();
  const notify = jest.fn();
  const tx = { application: { findUnique }, interview: { create } };
  const prisma = {
    $transaction: (action: (client: typeof tx) => Promise<unknown>) => action(tx),
  } as unknown as PrismaService;
  const notifications = { notify } as unknown as NotificationService;
  const service = new InterviewsService(prisma, notifications);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2035-05-01T00:00:00Z'));
    findUnique.mockResolvedValue(application);
    create.mockResolvedValue({ scheduledAt: new Date(scheduledAt), location: dto.location });
  });

  afterEach(() => jest.useRealTimers());

  it.each(['APPLIED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])(
    'rejects interview creation for %s and leaves the email queue untouched',
    async (status) => {
      findUnique.mockResolvedValue({ ...application, status });

      await expect(service.create('application', 'recruiter', dto)).rejects.toMatchObject({
        status: 409,
      });

      expect(create).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    },
  );

  it('rejects a recruiter from another company', async () => {
    await expect(service.create('application', 'other-recruiter', dto)).rejects.toMatchObject({
      status: 403,
    });

    expect(notify).not.toHaveBeenCalled();
  });

  it('queues a UTC invitation within the interview transaction', async () => {
    await service.create('application', 'recruiter', dto);

    expect(notify).toHaveBeenCalledWith(
      'candidate',
      'INTERVIEW_SCHEDULED',
      {
        jobTitle: 'Developer',
        scheduledAt: '2035-06-01T08:00:00.000Z',
        location: dto.location,
      },
      tx,
    );
  });
});
