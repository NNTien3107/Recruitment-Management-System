import { usePathname } from '../utils/navigation';
import { AppLink } from './Router';

export function Navbar() {
  const pathname = usePathname();
  const isJobsActive =
    pathname === '/' || pathname.startsWith('/jobs') || pathname.startsWith('/companies');
  const isRecruiterCompanyActive = pathname.startsWith('/recruiter/company');

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
            Hồ sơ công ty (Recruiter)
          </AppLink>
        </nav>

        <div className="rms-nav-actions">
          {/* TODO: Tích hợp trạng thái người dùng từ AuthContext của Tiến */}
          <span className="rms-env-pill">UC05 · UC06 · UC13</span>
        </div>
      </div>
    </header>
  );
}
