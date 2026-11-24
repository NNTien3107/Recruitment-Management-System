import { useState } from 'react';
import { Button, FormError, Input, Pagination, Select, Table, type Column } from '../components/ui';

interface Row {
  id: string;
  name: string;
  role: string;
}

const rows: Row[] = Array.from({ length: 45 }, (_, i) => ({
  id: String(i + 1),
  name: `Người dùng ${i + 1}`,
  role: i % 2 === 0 ? 'Nhà tuyển dụng' : 'Ứng viên',
}));

const columns: Column<Row>[] = [
  { header: 'Tên', cell: (row) => row.name },
  { header: 'Vai trò', cell: (row) => row.role },
];

const PAGE_SIZE = 10;

export function UiDemoPage() {
  const [page, setPage] = useState(1);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Component dùng chung (chỉ dev)</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Button</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Đang lưu</Button>
          <Button disabled>Vô hiệu</Button>
        </div>
      </section>

      <section className="max-w-sm space-y-3">
        <h2 className="font-medium">Input, Select, FormError</h2>
        <Input label="Bình thường" hint="Đây là gợi ý" />
        <Input label="Có lỗi" error="Trường này không hợp lệ" />
        <Select label="Chọn một">
          <option>Lựa chọn 1</option>
          <option>Lựa chọn 2</option>
        </Select>
        <FormError message="Lỗi chung của form" />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Table + Pagination</h2>
        <Table columns={columns} data={pageRows} getRowKey={(row) => row.id} />
        <Pagination
          meta={{
            page,
            pageSize: PAGE_SIZE,
            total: rows.length,
            totalPages: Math.ceil(rows.length / PAGE_SIZE),
          }}
          onPageChange={setPage}
        />
        <Table
          columns={columns}
          data={[]}
          getRowKey={(row) => row.id}
          emptyMessage="Chưa có dữ liệu"
        />
        <Table columns={columns} data={[]} getRowKey={(row) => row.id} isLoading />
      </section>
    </div>
  );
}
