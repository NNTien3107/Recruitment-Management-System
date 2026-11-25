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

## Kiểm tra với hồ sơ ứng tuyển

Nhánh tích hợp cần các bảng Candidate, CV và Application trước khi áp dụng migration phỏng vấn. Sau khi cấu hình SMTP và đăng nhập bằng tài khoản Recruiter qua Swagger, gọi `GET /api/recruiter/interviews/jobs` để chọn tin rồi gọi `GET /api/recruiter/jobs/{jobId}/applications` để chọn hồ sơ thuộc tin đó. Hai API lấy danh tính từ access token.

1. Gọi `PATCH /api/recruiter/applications/{applicationId}/status` để chuyển từ `APPLIED` sang `REVIEWING`. Hệ thống lưu lịch sử và thông báo cùng lúc.
2. Gọi `POST /api/recruiter/applications/{applicationId}/interviews` với `scheduledAt` ở tương lai, có múi giờ, và `location` là địa điểm hoặc liên kết. Việc đặt lịch giữ nguyên trạng thái hồ sơ.
3. Gọi `GET` trên cùng đường dẫn để xem lịch. Thêm `/{interviewId}` và dùng `PATCH` để đổi ngày giờ hoặc địa điểm, hay `DELETE` để hủy lịch.
4. Kiểm tra hộp thư SMTP của ứng viên cho từng thao tác. Gọi lại yêu cầu hủy hoặc gửi nội dung lịch giống hệt sẽ trả về lịch hiện tại và giữ nguyên số thông báo đã tạo.
