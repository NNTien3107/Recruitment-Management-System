import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../auth/auth-context';
import {
  cancelInterview,
  fetchInterviewApplications,
  fetchInterviewJobs,
  fetchInterviews,
  saveInterview,
  type ApplicationStatus,
  type Interview,
} from './interviews.api';
import { RecruiterInterviewsPage } from './RecruiterInterviewsPage';

vi.mock('./interviews.api', () => ({
  cancelInterview: vi.fn(),
  fetchInterviewApplications: vi.fn(),
  fetchInterviewJobs: vi.fn(),
  fetchInterviews: vi.fn(),
  saveInterview: vi.fn(),
}));

let schedule: Interview[];
const recruiter = {
  id: 'recruiter-id',
  email: 'recruiter@example.test',
  fullName: 'Nhà tuyển dụng',
  role: 'RECRUITER' as const,
};
const candidate = { fullName: 'Ứng Viên', email: 'candidate@example.test' };
const scheduledInput = '2050-06-01T09:30';
const scheduledAt = new Date(scheduledInput).toISOString();

beforeEach(() => {
  vi.resetAllMocks();
  schedule = [];
  vi.mocked(fetchInterviewJobs).mockResolvedValue({
    success: true,
    data: [{ id: 'job-id', title: 'Developer' }],
  });
  vi.mocked(fetchInterviews).mockImplementation(async () => schedule);
  vi.mocked(saveInterview).mockImplementation(async (_applicationId, id, input) => {
    const interview = { ...input, id: id ?? 'interview-id', cancelledAt: null };
    schedule = [interview];
    return interview;
  });
  vi.mocked(cancelInterview).mockImplementation(async () => {
    const interview = { ...schedule[0], cancelledAt: new Date().toISOString() };
    schedule = [interview];
    return interview;
  });
});

async function openApplication(status: ApplicationStatus = 'REVIEWING') {
  vi.mocked(fetchInterviewApplications).mockResolvedValue({
    success: true,
    data: [{ id: 'application-id', status, candidate }],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={{
          status: 'authenticated',
          user: recruiter,
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <RecruiterInterviewsPage />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText('Tin tuyển dụng'), 'job-id');
  await user.selectOptions(await screen.findByLabelText('Hồ sơ ứng tuyển'), 'application-id');
  await screen.findByRole('heading', { name: 'Lịch của Ứng Viên' });
  return user;
}

describe('RecruiterInterviewsPage', () => {
  it('creates, edits and cancels a schedule for the selected application', async () => {
    const user = await openApplication();
    await user.click(await screen.findByRole('button', { name: 'Tạo lịch' }));
    fireEvent.change(screen.getByLabelText('Ngày và giờ phỏng vấn'), {
      target: { value: scheduledInput },
    });
    await user.type(screen.getByLabelText('Địa điểm hoặc liên kết họp'), 'Phòng 1');
    await user.click(screen.getByRole('button', { name: 'Lưu lịch' }));
    await screen.findByText('Phòng 1');
    expect(saveInterview).toHaveBeenCalledWith('application-id', undefined, {
      scheduledAt,
      location: 'Phòng 1',
    });

    await user.click(screen.getByRole('button', { name: 'Đổi lịch' }));
    expect(screen.getByLabelText('Ngày và giờ phỏng vấn')).toHaveValue(scheduledInput);
    const location = screen.getByLabelText('Địa điểm hoặc liên kết họp');
    await user.clear(location);
    await user.type(location, 'Phòng 2');
    await user.click(screen.getByRole('button', { name: 'Lưu lịch' }));
    await screen.findByText('Phòng 2');
    expect(saveInterview).toHaveBeenLastCalledWith('application-id', 'interview-id', {
      scheduledAt,
      location: 'Phòng 2',
    });

    await user.click(screen.getByRole('button', { name: 'Hủy lịch' }));
    expect(cancelInterview).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Xác nhận hủy' }));
    await screen.findByText('Đã hủy', { exact: true });
    expect(cancelInterview).toHaveBeenCalledWith('application-id', 'interview-id');
  });

  it('keeps existing schedules visible when an application is ineligible', async () => {
    schedule = [{ id: 'interview-id', scheduledAt, location: 'Văn phòng', cancelledAt: null }];
    await openApplication('REJECTED');

    expect(await screen.findByText('Văn phòng')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tạo lịch' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đổi lịch' })).not.toBeInTheDocument();
  });

  it('preserves the form when saving fails', async () => {
    vi.mocked(saveInterview).mockRejectedValueOnce(new Error('Offline'));
    const user = await openApplication();
    await user.click(await screen.findByRole('button', { name: 'Tạo lịch' }));
    fireEvent.change(screen.getByLabelText('Ngày và giờ phỏng vấn'), {
      target: { value: scheduledInput },
    });
    await user.type(screen.getByLabelText('Địa điểm hoặc liên kết họp'), 'Phòng 1');
    await user.click(screen.getByRole('button', { name: 'Lưu lịch' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Đã có lỗi xảy ra');
    expect(screen.getByLabelText('Địa điểm hoặc liên kết họp')).toHaveValue('Phòng 1');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu lịch' })).toBeEnabled());
  });
});
