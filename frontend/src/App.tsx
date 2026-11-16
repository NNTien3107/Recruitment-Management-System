import './App.css';
import { Navbar } from './components/Navbar';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobsSearchPage } from './pages/JobsSearchPage';
import { RecruiterCompanyPage } from './pages/RecruiterCompanyPage';
import { usePathname } from './utils/navigation';

function App() {
  const pathname = usePathname();

  const renderPage = () => {
    if (pathname === '/recruiter/company') {
      return <RecruiterCompanyPage />;
    }

    const jobMatch = /^\/jobs\/([^/]+)$/.exec(pathname);
    if (jobMatch) {
      return <JobDetailPage jobId={decodeURIComponent(jobMatch[1])} />;
    }

    const companyMatch = /^\/companies\/([^/]+)$/.exec(pathname);
    if (companyMatch) {
      return <CompanyDetailPage companyId={decodeURIComponent(companyMatch[1])} />;
    }

    return <JobsSearchPage />;
  };

  return (
    <div className="rms-app-shell">
      <Navbar />
      <main className="rms-main-content">{renderPage()}</main>
      <footer className="rms-footer">
        <div className="rms-container">
          © {new Date().getFullYear()} Recruitment Management System — Nền tảng kết nối nhà tuyển
          dụng và ứng viên.
        </div>
      </footer>
    </div>
  );
}

export default App;
