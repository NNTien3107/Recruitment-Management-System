# Email thông báo tuyển dụng

`NotificationsModule` cung cấp `NotificationService` cho các module nghiệp vụ. Service lưu thông báo vào PostgreSQL. Tiến trình backend gửi email riêng qua SMTP, thử lại sau 30 giây và 2 phút khi gửi thất bại, rồi ghi log theo mã thông báo.

## Cấu hình Mailtrap

1. Trong thư mục `backend`, sao chép `.env.example` thành `.env` nếu chưa có và điền thông tin của Mailtrap Email Sandbox vào các biến `SMTP_*`.
2. Chạy `npm ci`, `npx prisma migrate deploy`, `npx prisma generate` và `npm run start:dev` từ thư mục `backend`.
3. Khi module nghiệp vụ gọi `notify`, kiểm tra email trong Mailtrap Sandbox và trường `emailSentAt` trong bảng `notifications`.

Nếu bỏ trống cấu hình SMTP, thông báo vẫn được lưu. Các thông báo đang chờ sẽ được gửi khi backend khởi động với SMTP đã bật. Với backend chạy bằng Docker, cung cấp các biến `SMTP_*` cho container backend để bật gửi email.

## Tích hợp vào module nghiệp vụ

Import `NotificationsModule` và inject `NotificationService`. Khi thay đổi trạng thái hoặc lịch phỏng vấn bằng transaction Prisma, gọi `notify` trong cùng transaction để thông báo chỉ xuất hiện sau khi transaction commit.

```ts
await notificationService.notify(
  candidateUserId,
  'APPLICATION_STATUS_CHANGED',
  {
    jobTitle,
    previousStatus,
    status,
  },
  tx,
);
```

`candidateUserId` là ID tài khoản `User`. Ba sự kiện lịch phỏng vấn `INTERVIEW_SCHEDULED`, `INTERVIEW_RESCHEDULED` và `INTERVIEW_CANCELLED` nhận payload gồm `jobTitle`, `scheduledAt` (ISO 8601 UTC, ví dụ `date.toISOString()`) và `location` (địa chỉ hoặc liên kết phỏng vấn). Mẫu email hiển thị thời gian UTC.

Khi tiến trình dừng sau lúc SMTP nhận email và trước lúc PostgreSQL ghi nhận đã gửi, lần chạy tiếp theo có thể gửi lại email đó.
