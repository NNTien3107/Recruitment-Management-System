import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface Column<T> {
  header: string; // cũng dùng làm key, nên đặt khác nhau giữa các cột
  cell: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
}: TableProps<T>) {
  const message = isLoading ? 'Đang tải...' : data.length === 0 ? emptyMessage : null;

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                scope="col"
                className={cn('px-4 py-3 font-medium', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {message ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {message}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.header} className={cn('px-4 py-3', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
