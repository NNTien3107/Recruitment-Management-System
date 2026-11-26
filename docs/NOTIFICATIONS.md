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

## Xem thông báo trong ứng dụng

Ứng viên mở **Thông báo** ở thanh điều hướng hoặc vào `/candidate/notifications`. Màn hình hiển thị thông báo đổi trạng thái hồ sơ và thông báo tạo, đổi, hủy lịch phỏng vấn từ mới đến cũ. Ngày giờ hiển thị theo múi giờ của trình duyệt.

`GET /api/candidate/notifications?page=1&pageSize=20` yêu cầu access token của ứng viên. API lấy danh tính từ phiên đăng nhập và trả danh sách kèm thông tin phân trang. Cấu hình SMTP chỉ ảnh hưởng đến gửi email. Thông báo đã lưu vẫn hiển thị trong ứng dụng khi SMTP tắt.
