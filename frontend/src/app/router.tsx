import { createBrowserRouter } from 'react-router-dom';
import { GuestOnlyRoute } from '../features/auth/GuestOnlyRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { MainLayout } from '../layouts/MainLayout';
import { AdminPage } from '../pages/AdminPage';
import { CompanyDetailPage } from '../pages/CompanyDetailPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { JobDetailPage } from '../pages/JobDetailPage';
import { JobsSearchPage } from '../pages/JobsSearchPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { RecruiterCompanyPage } from '../pages/RecruiterCompanyPage';
import { RecruiterJobsPage } from '../pages/RecruiterJobsPage';
import { UiDemoPage } from '../pages/UiDemoPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Công khai (Guest & Candidate): Tìm kiếm việc làm, Chi tiết việc làm, Chi tiết công ty (UC05, UC06)
      { index: true, element: <JobsSearchPage /> },
      { path: 'jobs', element: <JobsSearchPage /> },
      { path: 'jobs/:id', element: <JobDetailPage /> },
      { path: 'companies/:id', element: <CompanyDetailPage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },

      // Chỉ khách chưa đăng nhập
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },

      // Khu vực Candidate (Oanh phụ trách)
      {
        element: <ProtectedRoute roles={['CANDIDATE']} />,
        children: [{ path: 'candidate', element: <PlaceholderPage title="Khu vực ứng viên" /> }],
      },

      // Khu vực Recruiter: Quản lý công ty & Tin tuyển dụng (UC13, UC14, UC15 - Nam)
      {
        element: <ProtectedRoute roles={['RECRUITER']} />,
        children: [
          { path: 'recruiter', element: <RecruiterJobsPage /> },
          { path: 'recruiter/jobs', element: <RecruiterJobsPage /> },
          { path: 'recruiter/company', element: <RecruiterCompanyPage /> },
        ],
      },

      // Khu vực Admin: Duyệt tin & Quản lý người dùng (UC21, UC22, UC23 - Nam)
      {
        element: <ProtectedRoute roles={['ADMIN']} />,
        children: [
          { path: 'admin', element: <AdminPage key="admin-default" /> },
          { path: 'admin/jobs', element: <AdminPage key="admin-jobs" initialTab="jobs" /> },
          { path: 'admin/users', element: <AdminPage key="admin-users" initialTab="users" /> },
        ],
      },

      // Chỉ có khi chạy dev, tự biến mất ở bản build
      ...(import.meta.env.DEV ? [{ path: 'dev/ui', element: <UiDemoPage /> }] : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
