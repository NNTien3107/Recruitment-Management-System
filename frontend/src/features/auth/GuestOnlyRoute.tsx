import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { useAuth } from './auth-context';
import { homePathForRole } from './paths';

/** Dành cho /login, /register: đã đăng nhập thì chuyển đi nơi khác. */
export function GuestOnlyRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? homePathForRole(user.role)} replace />;
  }
  return <Outlet />;
}
