import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchMe } from '../features/auth/auth.api';
import { getErrorMessage } from '../lib/errors';

export function PlaceholderPage({ title }: { title: string }) {
  const me = useQuery({ queryKey: ['auth', 'me'], queryFn: fetchMe });
  const [result, setResult] = useState('');

  // Chỉ để kiểm thử: bắn 3 request song song, kỳ vọng chỉ có 1 lần refresh. Xóa khi làm trang thật.
  const fireParallel = async () => {
    const results = await Promise.allSettled([fetchMe(), fetchMe(), fetchMe()]);
    setResult(results.map((r) => r.status).join(', '));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-gray-600">Trang tạm, module tương ứng sẽ thay thế.</p>

      <div className="mt-6 rounded border border-dashed border-gray-300 p-4 text-sm">
        <p className="mb-2 font-medium">Khu vực kiểm thử xác thực (xóa sau)</p>
        {me.isPending && <p>Đang tải...</p>}
        {me.isError && <p className="text-red-600">{getErrorMessage(me.error)}</p>}
        {me.data && <pre className="overflow-auto">{JSON.stringify(me.data, null, 2)}</pre>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void me.refetch()}
            className="rounded border px-3 py-1 hover:bg-gray-100"
          >
            Gọi lại /auth/me
          </button>
          <button
            type="button"
            onClick={() => void fireParallel()}
            className="rounded border px-3 py-1 hover:bg-gray-100"
          >
            Gọi 3 request song song
          </button>
        </div>
        {result && <p className="mt-2">Kết quả: {result}</p>}
      </div>
    </div>
  );
}
