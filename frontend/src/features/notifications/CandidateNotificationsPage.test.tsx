import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../auth/auth-context';
import { CandidateNotificationsPage } from './CandidateNotificationsPage';
import { fetchMyNotifications, type CandidateNotification } from './notifications.api';

vi.mock('./notifications.api', () => ({ fetchMyNotifications: vi.fn() }));

const account = {
  id: 'candidate-id',
  email: 'candidate@example.test',
  fullName: 'Ứng viên',
  role: 'CANDIDATE' as const,
};

const schedule: CandidateNotification = {
  id: 'interview-notification',
  type: 'INTERVIEW_RESCHEDULED',
  createdAt: '2026-11-26T08:00:00.000Z',
  payload: {
    jobTitle: 'Lập trình viên',
    scheduledAt: '2026-12-01T02:00:00.000Z',
    location: 'Phòng 2',
  },
};

const status: CandidateNotification = {
  id: 'status-notification',
  type: 'APPLICATION_STATUS_CHANGED',
  createdAt: '2026-11-25T08:00:00.000Z',
  payload: { jobTitle: 'Kiểm thử viên', previousStatus: 'APPLIED', status: 'REVIEWING' },
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={{ status: 'authenticated', user: account, login: vi.fn(), logout: vi.fn() }}
      >
        <CandidateNotificationsPage />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

function results(data: CandidateNotification[], page = 1, totalPages = 1) {
  return {
    success: true as const,
    data,
    meta: { page, pageSize: 20, total: data.length + (totalPages - 1) * 20, totalPages },
  };
}

beforeEach(() => vi.resetAllMocks());

describe('CandidateNotificationsPage', () => {
  it('shows an interview change and loads the next page of application updates', async () => {
    vi.mocked(fetchMyNotifications).mockImplementation(async (page) =>
      page === 1 ? results([schedule], 1, 2) : results([status], 2, 2),
    );
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Lịch phỏng vấn đã thay đổi' }),
    ).toBeVisible();
    expect(screen.getByText('Phòng 2')).toBeVisible();
    expect(
      screen.getByText('Giờ phỏng vấn').nextElementSibling?.querySelector('time'),
    ).toHaveAttribute('datetime', schedule.payload.scheduledAt);
    await userEvent.click(screen.getByRole('button', { name: 'Sau' }));

    expect(await screen.findByText('Đã nộp → Đang xem xét')).toBeVisible();
    expect(fetchMyNotifications).toHaveBeenLastCalledWith(2, expect.any(AbortSignal));
  });

  it('retries a failed request and shows the empty state', async () => {
    vi.mocked(fetchMyNotifications)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(results([]));
    renderPage();

    expect(await screen.findByRole('alert')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));

    expect(await screen.findByText('Bạn chưa có thông báo.')).toBeVisible();
  });
});
