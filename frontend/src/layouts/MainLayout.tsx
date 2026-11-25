import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { navItemsByRole } from './nav-items';

export function MainLayout() {
  const { user, logout } = useAuth();
  const items = user ? navItemsByRole[user.role] : [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-semibold">
              Recruitment
            </Link>
            <nav className="flex gap-4 text-sm">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-gray-600">{user.fullName}</span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:underline">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
