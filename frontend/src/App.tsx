
import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';

import { Navbar as PublicNavbar } from './components/Navbar';
import { Navbar as RoleNavbar } from './components/common/Navbar';

import { ApplicationHistoryPage } from './pages/candidate/ApplicationHistoryPage';
import { CvsPage } from './pages/candidate/CvsPage';
import { ProfilePage } from './pages/candidate/ProfilePage';

import { JobApplicantsPage } from './pages/recruiter/JobApplicantsPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobsSearchPage } from './pages/JobsSearchPage';
import { RecruiterCompanyPage } from './pages/RecruiterCompanyPage';
import { RecruiterJobsPage } from './pages/RecruiterJobsPage';

function JobDetailRoute() {
  const { jobId } = useParams<{ jobId: string }>();
  return <JobDetailPage jobId={jobId ?? ''} />;
}

function CompanyDetailRoute() {
  const { companyId } = useParams<{ companyId: string }>();
  return <CompanyDetailPage companyId={companyId ?? ''} />;
}

type UserRole = 'CANDIDATE' | 'RECRUITER';

interface AppLayoutProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

function AppLayout({ currentRole, onRoleChange }: AppLayoutProps) {
  const { pathname } = useLocation();

  const isCandidateArea =
    pathname.startsWith('/candidate') || pathname === '/recruiter/applicants';

  return (
    <div className="rms-app-shell">
      {isCandidateArea ? (
        <RoleNavbar
          currentRole={currentRole}
          onRoleChange={onRoleChange}
        />
      ) : (
        <PublicNavbar />
      )}

      <main className="rms-main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />

          {/* Khu vực tìm việc */}
          <Route path="/jobs" element={<JobsSearchPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailRoute />} />
          <Route path="/companies/:companyId" element={<CompanyDetailRoute />} />

          {/* Khu vực ứng viên */}
          <Route path="/candidate/profile" element={<ProfilePage />} />
          <Route path="/candidate/cvs" element={<CvsPage />} />
          <Route
            path="/candidate/applications"
            element={<ApplicationHistoryPage />}
          />

          {/* Khu vực nhà tuyển dụng */}
          <Route
            path="/recruiter/company"
            element={<RecruiterCompanyPage />}
          />
          <Route
            path="/recruiter/jobs"
            element={<RecruiterJobsPage />}
          />
          <Route
            path="/recruiter/applicants"
            element={<JobApplicantsPage />}
          />

          {/* Đường dẫn không tồn tại */}
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </main>

      <footer className="rms-footer">
        <div className="rms-container">
          © {new Date().getFullYear()} Recruitment Management System — Nền tảng
          kết nối nhà tuyển dụng và ứng viên.
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('rms_user_role');
    return savedRole === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE';
  });

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('rms_user_role', role);

    localStorage.setItem(
      'rms_user_id',
      role === 'CANDIDATE'
        ? '00000000-0000-0000-0000-000000000001'
        : '00000000-0000-0000-0000-000000000002',
    );
  };

  return (
    <BrowserRouter>
      <AppLayout
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />
    </BrowserRouter>
  );
}

export default App;
