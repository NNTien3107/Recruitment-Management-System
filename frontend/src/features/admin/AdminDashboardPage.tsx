import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import type { ApiResponse } from '../../lib/types';
import { useAuth } from '../auth/auth-context';

interface AdminOverview {
  userCount: number;
  jobCount: number;
  applicationCount: number | null;
}

const numberFormat = new Intl.NumberFormat('vi-VN');

export function AdminDashboardPage() {
  const { user } = useAuth();
  const overview = useQuery({
    queryKey: ['admin', user?.id, 'dashboard'],
    enabled: Boolean(user),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<ApiResponse<AdminOverview>>('/admin/dashboard', { signal });
      return data.data;
    },
  });

  if (!user) return null;

  return (
    <section className="grid gap-5" aria-labelledby="admin-dashboard-title">
      <h1 id="admin-dashboard-title" className="text-2xl font-semibold">
        Tổng quan hệ thống
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
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Người dùng', value: overview.data.userCount },
            { label: 'Tin tuyển dụng', value: overview.data.jobCount },
            { label: 'Đơn ứng tuyển', value: overview.data.applicationCount },
          ].map(({ label, value }) => (
            <div key={label} className="grid gap-2 rounded-lg border border-gray-200 bg-white p-5">
              <dt className="font-medium text-gray-700">{label}</dt>
              <dd
                className={
                  value === null ? 'text-sm text-gray-600' : 'text-3xl font-semibold tabular-nums'
                }
              >
                {value === null ? 'Chờ tích hợp' : numberFormat.format(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
