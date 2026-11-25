import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, Interview, Prisma } from '@prisma/client';
import { isTerminalStatus } from '../applications/utils/application-state-machine';
import { NotificationService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewScheduleDto } from './dto/interview-schedule.dto';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async findAll(applicationId: string, recruiterId: string) {
    await this.findOwnedApplication(this.prisma, applicationId, recruiterId);
    return this.prisma.interview.findMany({
      where: { applicationId },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });
  }

  create(applicationId: string, recruiterId: string, dto: InterviewScheduleDto) {
    const scheduledAt = this.futureTime(dto.scheduledAt);
    return this.changeInterview(async (tx) => {
      const application = await this.findOwnedApplication(tx, applicationId, recruiterId);
      if (
        application.status === ApplicationStatus.APPLIED ||
        isTerminalStatus(application.status)
      ) {
        throw new ConflictException('Chỉ đặt lịch cho hồ sơ đang được xem xét và chưa kết thúc');
      }

      const interview = await tx.interview.create({
        data: { applicationId, scheduledAt, location: dto.location },
      });
      await this.notifications.notify(
        application.candidateId,
        'INTERVIEW_SCHEDULED',
        this.payload(interview, application.job.title),
        tx,
      );
      return interview;
    });
  }

  reschedule(applicationId: string, id: string, recruiterId: string, dto: InterviewScheduleDto) {
    return this.changeInterview(async (tx) => {
      const application = await this.findOwnedApplication(tx, applicationId, recruiterId);
      const current = await this.findInterview(tx, applicationId, id);
      if (current.cancelledAt || isTerminalStatus(application.status)) {
        throw new ConflictException('Không thể đổi lịch đã hủy hoặc lịch của hồ sơ đã kết thúc');
      }
      const scheduledAt = this.futureTime(dto.scheduledAt);
      if (
        current.scheduledAt.getTime() === scheduledAt.getTime() &&
        current.location === dto.location
      ) {
        return current;
      }
      const interview = await tx.interview.update({
        where: { id },
        data: { scheduledAt, location: dto.location },
      });
      await this.notifications.notify(
        application.candidateId,
        'INTERVIEW_RESCHEDULED',
        this.payload(interview, application.job.title),
        tx,
      );
      return interview;
    });
  }

  cancel(applicationId: string, id: string, recruiterId: string) {
    return this.changeInterview(async (tx) => {
      const application = await this.findOwnedApplication(tx, applicationId, recruiterId);
      const current = await this.findInterview(tx, applicationId, id);
      if (current.cancelledAt) return current;

      const interview = await tx.interview.update({
        where: { id },
        data: { cancelledAt: new Date() },
      });
      await this.notifications.notify(
        application.candidateId,
        'INTERVIEW_CANCELLED',
        this.payload(interview, application.job.title),
        tx,
      );
      return interview;
    });
  }

  private async findOwnedApplication(
    db: Prisma.TransactionClient,
    id: string,
    recruiterId: string,
  ) {
    const application = await db.application.findUnique({
      where: { id },
      select: {
        candidateId: true,
        status: true,
        job: { select: { title: true, company: { select: { ownerId: true } } } },
      },
    });
    if (!application) throw new NotFoundException('Không tìm thấy hồ sơ ứng tuyển');
    if (application.job.company.ownerId !== recruiterId) {
      throw new ForbiddenException('Bạn không có quyền quản lý lịch của hồ sơ này');
    }
    return application;
  }

  private async findInterview(tx: Prisma.TransactionClient, applicationId: string, id: string) {
    const interview = await tx.interview.findUnique({ where: { id, applicationId } });
    if (!interview) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    return interview;
  }

  private futureTime(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      throw new BadRequestException('Chọn thời gian phỏng vấn trong tương lai');
    }
    return date;
  }

  private payload(interview: Interview, jobTitle: string) {
    return {
      jobTitle,
      scheduledAt: interview.scheduledAt.toISOString(),
      location: interview.location,
    };
  }

  private async changeInterview(action: (tx: Prisma.TransactionClient) => Promise<Interview>) {
    try {
      return await this.prisma.$transaction(action, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Lịch phỏng vấn vừa thay đổi. Vui lòng tải lại.');
      }
      throw error;
    }
  }
}
