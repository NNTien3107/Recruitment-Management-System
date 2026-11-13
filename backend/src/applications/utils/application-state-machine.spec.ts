import { ApplicationStatus } from '@prisma/client';
import {
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
} from './application-state-machine';

describe('ApplicationStateMachine (canTransition)', () => {
  describe('Từ trạng thái APPLIED', () => {
    it('cho phép chuyển sang REVIEWING, REJECTED, WITHDRAWN', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.REVIEWING)).toBe(true);
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.REJECTED)).toBe(true);
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.WITHDRAWN)).toBe(true);
    });

    it('từ chối nhảy cóc sang OFFERED, ACCEPTED, INTERVIEW_SCHEDULED', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.OFFERED)).toBe(false);
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.ACCEPTED)).toBe(false);
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW_SCHEDULED)).toBe(
        false,
      );
    });

    it('từ chối chuyển sang chính APPLIED', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.APPLIED)).toBe(false);
    });
  });

  describe('Từ trạng thái REVIEWING', () => {
    it('cho phép chuyển sang INTERVIEW_SCHEDULED, REJECTED, WITHDRAWN', () => {
      expect(
        canTransition(ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEW_SCHEDULED),
      ).toBe(true);
      expect(canTransition(ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED)).toBe(true);
      expect(canTransition(ApplicationStatus.REVIEWING, ApplicationStatus.WITHDRAWN)).toBe(true);
    });

    it('từ chối quay lại APPLIED hoặc nhảy cóc sang ACCEPTED', () => {
      expect(canTransition(ApplicationStatus.REVIEWING, ApplicationStatus.APPLIED)).toBe(false);
      expect(canTransition(ApplicationStatus.REVIEWING, ApplicationStatus.ACCEPTED)).toBe(false);
    });
  });

  describe('Từ trạng thái INTERVIEW_SCHEDULED', () => {
    it('cho phép chuyển sang OFFERED, REVIEWING (vòng tiếp), REJECTED, WITHDRAWN', () => {
      expect(canTransition(ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.OFFERED)).toBe(
        true,
      );
      expect(
        canTransition(ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REVIEWING),
      ).toBe(true);
      expect(canTransition(ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REJECTED)).toBe(
        true,
      );
    });

    it('từ chối nhảy thẳng sang ACCEPTED khi chưa OFFERED', () => {
      expect(canTransition(ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.ACCEPTED)).toBe(
        false,
      );
    });
  });

  describe('Từ trạng thái OFFERED', () => {
    it('cho phép chuyển sang ACCEPTED, REJECTED, WITHDRAWN', () => {
      expect(canTransition(ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED)).toBe(true);
      expect(canTransition(ApplicationStatus.OFFERED, ApplicationStatus.REJECTED)).toBe(true);
      expect(canTransition(ApplicationStatus.OFFERED, ApplicationStatus.WITHDRAWN)).toBe(true);
    });

    it('từ chối quay lại APPLIED hoặc REVIEWING', () => {
      expect(canTransition(ApplicationStatus.OFFERED, ApplicationStatus.APPLIED)).toBe(false);
      expect(canTransition(ApplicationStatus.OFFERED, ApplicationStatus.REVIEWING)).toBe(false);
    });
  });

  describe('Từ các trạng thái kết thúc (Terminal States)', () => {
    it('từ chối mọi chuyển đổi từ ACCEPTED', () => {
      expect(isTerminalStatus(ApplicationStatus.ACCEPTED)).toBe(true);
      expect(getAllowedTransitions(ApplicationStatus.ACCEPTED)).toEqual([]);
      expect(canTransition(ApplicationStatus.ACCEPTED, ApplicationStatus.REVIEWING)).toBe(false);
      expect(canTransition(ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED)).toBe(false);
    });

    it('từ chối mọi chuyển đổi từ REJECTED', () => {
      expect(isTerminalStatus(ApplicationStatus.REJECTED)).toBe(true);
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.APPLIED)).toBe(false);
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.REVIEWING)).toBe(false);
    });

    it('từ chối mọi chuyển đổi từ WITHDRAWN', () => {
      expect(isTerminalStatus(ApplicationStatus.WITHDRAWN)).toBe(true);
      expect(canTransition(ApplicationStatus.WITHDRAWN, ApplicationStatus.APPLIED)).toBe(false);
    });
  });
});
