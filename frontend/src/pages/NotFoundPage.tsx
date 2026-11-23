import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">404 - Không tìm thấy trang</h1>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
