import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { useAuth } from './auth-context';
import type { Role } from './types';

/** Bọc các route cần đăng nhập. Truyền `roles` để giới hạn theo vai trò. */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
