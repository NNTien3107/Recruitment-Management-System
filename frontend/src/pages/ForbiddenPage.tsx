import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">403 - Không có quyền truy cập</h1>
      <p className="mt-2 text-gray-600">Tài khoản của bạn không được phép xem trang này.</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
