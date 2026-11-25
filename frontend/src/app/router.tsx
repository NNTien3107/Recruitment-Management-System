import { createBrowserRouter } from 'react-router-dom';
import { GuestOnlyRoute } from '../features/auth/GuestOnlyRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RecruiterInterviewsPage } from '../features/interviews/RecruiterInterviewsPage';
import { MainLayout } from '../layouts/MainLayout';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { UiDemoPage } from '../pages/UiDemoPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Công khai (Guest)
      { index: true, element: <HomePage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },

      // Chỉ khách chưa đăng nhập (/register sẽ thêm ở Bước 12)
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },

      // Theo vai trò: mỗi người thêm route của module mình vào đúng nhóm dưới đây
      {
        element: <ProtectedRoute roles={['CANDIDATE']} />,
        children: [{ path: 'candidate', element: <PlaceholderPage title="Khu vực ứng viên" /> }],
      },
      {
        element: <ProtectedRoute roles={['RECRUITER']} />,
        children: [
          { path: 'recruiter', element: <PlaceholderPage title="Khu vực nhà tuyển dụng" /> },
          { path: 'recruiter/interviews', element: <RecruiterInterviewsPage /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['ADMIN']} />,
        children: [{ path: 'admin', element: <PlaceholderPage title="Khu vực quản trị" /> }],
      },
      // Chỉ có khi chạy dev, tự biến mất ở bản build
      ...(import.meta.env.DEV ? [{ path: 'dev/ui', element: <UiDemoPage /> }] : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
