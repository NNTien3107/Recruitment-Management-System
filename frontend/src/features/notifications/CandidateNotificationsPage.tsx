import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { getErrorMessage } from '../../lib/errors';
import { useAuth } from '../auth/auth-context';
import { fetchMyNotifications, type CandidateNotification } from './notifications.api';

const statusLabels: Readonly<Partial<Record<string, string>>> = {
  APPLIED: 'Đã nộp',
  REVIEWING: 'Đang xem xét',
  INTERVIEW_SCHEDULED: 'Đã lên lịch phỏng vấn',
  OFFERED: 'Đã gửi lời mời nhận việc',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút đơn',
};

const interviewTitles = {
  INTERVIEW_SCHEDULED: 'Lịch phỏng vấn mới',
  INTERVIEW_RESCHEDULED: 'Lịch phỏng vấn đã thay đổi',
  INTERVIEW_CANCELLED: 'Lịch phỏng vấn đã hủy',
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

function NotificationItem({ notification }: { notification: CandidateNotification }) {
  const { payload, type, createdAt } = notification;
  const title = type === 'APPLICATION_STATUS_CHANGED' ? 'Cập nhật hồ sơ' : interviewTitles[type];

  return (
    <li className="grid gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <time className="text-sm text-gray-600" dateTime={createdAt}>
          {dateFormat.format(new Date(createdAt))}
        </time>
      </div>
      <p className="wrap-anywhere font-medium text-gray-900">{payload.jobTitle}</p>
      {type === 'APPLICATION_STATUS_CHANGED' ? (
        <p className="text-sm text-gray-700">
          {statusLabels[payload.previousStatus] ?? payload.previousStatus}
          {' → '}
          {statusLabels[payload.status] ?? payload.status}
        </p>
      ) : (
        <dl className="grid gap-1 text-sm text-gray-700">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium">Giờ phỏng vấn</dt>
            <dd>
              <time dateTime={payload.scheduledAt}>
                {dateFormat.format(new Date(payload.scheduledAt))}
              </time>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium">Địa điểm hoặc liên kết</dt>
            <dd className="wrap-anywhere min-w-0">{payload.location}</dd>
          </div>
        </dl>
      )}
    </li>
  );
}

export function CandidateNotificationsPage() {
  const { user } = useAuth();

  if (!user) return null;
  return <CandidateNotifications key={user.id} userId={user.id} />;
}

function CandidateNotifications({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const notices = useQuery({
    queryKey: ['candidate', userId, 'notifications', page],
    queryFn: ({ signal }) => fetchMyNotifications(page, signal),
  });

  return (
    <section
      className="mx-auto grid max-w-3xl gap-5"
      aria-labelledby="candidate-notifications-title"
    >
      <h1 id="candidate-notifications-title" className="text-2xl font-semibold">
        Thông báo
      </h1>
      {notices.isPending && <p role="status">Đang tải thông báo…</p>}
      {notices.isError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-red-700">
            {getErrorMessage(notices.error)}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void notices.refetch()}>
            Tải lại
          </Button>
        </div>
      )}
      {notices.isSuccess && (
        <>
          {notices.data.data.length === 0 ? (
            <p className="text-gray-600">
              {page === 1 ? 'Bạn chưa có thông báo.' : 'Trang này chưa có thông báo.'}
            </p>
          ) : (
            <ul className="grid gap-3" aria-label="Danh sách thông báo">
              {notices.data.data.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
          )}
          {notices.data.meta.totalPages > 1 && (
            <Pagination meta={notices.data.meta} onPageChange={setPage} />
          )}
        </>
      )}
    </section>
  );
}
