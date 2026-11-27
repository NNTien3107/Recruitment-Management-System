import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import type { ApiResponse } from '../../lib/types';
import { useAuth } from '../auth/auth-context';

interface RecruiterOverview {
  jobCount: number;
  applicationCount: number | null;
}

const numberFormat = new Intl.NumberFormat('vi-VN');

export function RecruiterDashboardPage() {
  const { user } = useAuth();
  const overview = useQuery({
    queryKey: ['recruiter', user?.id, 'dashboard'],
    enabled: Boolean(user),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<ApiResponse<RecruiterOverview>>('/jobs/my-overview', {
        signal,
      });
      return data.data;
    },
  });

  if (!user) return null;

  return (
    <section className="grid gap-5" aria-labelledby="recruiter-dashboard-title">
      <h1 id="recruiter-dashboard-title" className="text-2xl font-semibold">
        Tổng quan tuyển dụng
      </h1>
      {overview.isPending && <p role="status">Đang tải số liệu…</p>}
      {overview.isError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-red-700">
            {getErrorMessage(overview.error)}
          </p>
          <Button size="sm" variant="secondary" onClick={() => void overview.refetch()}>
            Tải lại
          </Button>
        </div>
      )}
      {overview.isSuccess && (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 rounded-lg border border-gray-200 bg-white p-5">
            <dt className="font-medium text-gray-700">Tin tuyển dụng của công ty bạn</dt>
            <dd className="text-3xl font-semibold tabular-nums">
              {numberFormat.format(overview.data.jobCount)}
            </dd>
          </div>
          <div className="grid gap-2 rounded-lg border border-gray-200 bg-white p-5">
            <dt className="font-medium text-gray-700">Đơn ứng tuyển</dt>
            {overview.data.applicationCount === null ? (
              <dd className="text-sm text-gray-600">
                Chờ tích hợp số đơn, tỷ lệ theo trạng thái và số đơn theo thời gian.
              </dd>
            ) : (
              <dd className="text-3xl font-semibold tabular-nums">
                {numberFormat.format(overview.data.applicationCount)}
              </dd>
            )}
          </div>
        </dl>
      )}
    </section>
  );
}
