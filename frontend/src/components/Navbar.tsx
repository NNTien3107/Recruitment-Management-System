import { usePathname } from '../utils/navigation';
import { AppLink } from './Router';

export function Navbar() {
  const pathname = usePathname();
  const isJobsActive =
    pathname === '/' || pathname.startsWith('/jobs') || pathname.startsWith('/companies');
  const isRecruiterCompanyActive = pathname.startsWith('/recruiter/company');
  const isRecruiterJobsActive = pathname.startsWith('/recruiter/jobs');
  const isAdminUsersActive = pathname.startsWith('/admin/users');
  const isAdminJobsActive = pathname.startsWith('/admin/jobs');

  return (
    <header className="rms-navbar">
      <div className="rms-container rms-navbar-inner">
        <AppLink to="/jobs" className="rms-brand">
          <span className="rms-brand-badge">RMS</span>
          <span className="rms-brand-text">Recruitment Portal</span>
        </AppLink>

        <nav className="rms-nav-links">
          <AppLink to="/jobs" className={`rms-nav-link ${isJobsActive ? 'active' : ''}`}>
            Tìm việc làm
          </AppLink>
          <AppLink
            to="/recruiter/company"
            className={`rms-nav-link ${isRecruiterCompanyActive ? 'active' : ''}`}
          >
            Hồ sơ công ty
          </AppLink>
          <AppLink
            to="/recruiter/jobs"
            className={`rms-nav-link ${isRecruiterJobsActive ? 'active' : ''}`}
          >
            Quản lý tin đăng
          </AppLink>
          <AppLink to="/admin/jobs" className={`rms-nav-link ${isAdminJobsActive ? 'active' : ''}`}>
            Duyệt tin (Admin)
          </AppLink>
          <AppLink
            to="/admin/users"
            className={`rms-nav-link ${isAdminUsersActive ? 'active' : ''}`}
          >
            Người dùng (Admin)
          </AppLink>
        </nav>

        <div className="rms-nav-actions">
          {/* TODO: Tích hợp trạng thái người dùng từ AuthContext của Tiến */}
          <span className="rms-env-pill">Full Module (Nam)</span>
        </div>
      </div>
    </header>
  );
}
