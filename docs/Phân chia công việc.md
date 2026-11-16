## **Phân công nhiệm vụ**

Mỗi người làm cả Backend lẫn Frontend của module mình phụ trách. Ai cũng được review PR của người khác nên cả nhóm cùng hiểu toàn hệ thống.

| Thành viên | Phạm vi | Use case | FR | Độ khó |
| ----- | ----- | ----- | ----- | ----- |
| Tiến | Auth, RBAC, hạ tầng, audit log | UC01-04, UC25 | FR-01 đến 05, FR-35 | 4/5 |
| Nam | Company, Jobs, Search, Admin | UC05, 06, 13, 14, 15, 21, 22, 23 | FR-17 đến 24, FR-31 đến 33 | 3,5/5 |
| Oanh | Candidate, CV, Applications | UC07, 08, 09, 10, 11, 16, 17, 18 | FR-08 đến 13, FR-25 đến 27 | 4,5/5 |
| Thành | Interviews, Email, Notification, Dashboard | UC19, 20, 24, 26, 27, 12 | FR-14, 15, 28 đến 30, FR-34 | 4/5 |

### **Tiến: Auth, RBAC, hạ tầng**

**Tuần đầu (làm trước để cả nhóm không bị chặn):**

* Tạo repo monorepo `/backend` và `/frontend`; cấu hình ESLint, Prettier, Husky.  
* Viết `docker-compose.yml` (PostgreSQL \+ backend \+ frontend) để ai clone về cũng chạy bằng `docker compose up`.  
* Tạo GitHub Actions chạy lint, test, build mỗi Pull Request; bảo vệ nhánh `main` và `develop`.  
* Dựng khung NestJS: `ConfigModule` đọc `.env`, `PrismaService`, `ValidationPipe`, Exception Filter, Response Interceptor, Swagger.  
* Viết một module mẫu hoàn chỉnh `users` để các thành viên làm theo.

**Auth và RBAC (UC01-04):**

* Băm mật khẩu bằng bcrypt hoặc argon2. Access token 15 phút, refresh token 7 ngày lưu hash trong DB, có rotation, gửi qua httpOnly cookie.  
* Tạo `JwtAuthGuard`, `RolesGuard`, decorator `@Roles()` và `@CurrentUser()` để mọi module dùng lại.  
* Cung cấp hàm thu hồi toàn bộ refresh token của một user (B gọi khi Admin khóa tài khoản).  
* Rate limit đăng nhập (5 lần/phút/IP), cấu hình CORS và Helmet.

**Khung Frontend:** React Router, axios instance tự refresh token khi gặp 401, `ProtectedRoute` theo vai trò, layout chung, component dùng chung (Button, Table, Pagination, Form).

**Sau khi xong Auth:** audit log (UC25), review PR, viết test phân quyền chéo giữa các module, deploy.

### **Nam \- Company, Jobs, Search, Admin**

**Company (UC13):** Recruiter tạo và sửa thông tin công ty, quan hệ 1-1 với tài khoản Recruiter. Logo dùng `StorageService` chung do C dựng.

**Jobs (UC14, UC15):**

* Trạng thái tin: DRAFT, PENDING, APPROVED, CLOSED, REJECTED. Chỉ APPROVED mới hiển thị công khai.  
* Xóa mềm bằng cột `deletedAt` (BR-05). Kiểm tra công ty đã có trước khi đăng tin (BR-04).  
* Sửa tin đã APPROVED thì chuyển lại PENDING (BR-08).  
* Kiểm tra quyền sở hữu: Recruiter chỉ sửa, đóng tin của chính mình.

**Search và phân trang (UC05, UC06):**

* Một endpoint `GET /jobs` nhận `keyword, skills, location, salaryMin, salaryMax, jobType, level, sort, page, pageSize` (tối đa 50).  
* Chỉ trả tin APPROVED và đang mở. Đánh index các cột lọc.  
* Seed khoảng 10.000 tin để kiểm tra thời gian phản hồi dưới 500 ms.

**Admin (UC21, 22, 23):** danh sách và lọc người dùng; khóa/mở khóa (gọi hàm thu hồi token của A); duyệt hoặc từ chối tin kèm lý do. Phần này cần phối hợp với A.

### **Oanh \- Candidate, CV, Applications**

**Hồ sơ cá nhân (UC07):** học vấn, kinh nghiệm, kỹ năng; mỗi Candidate chỉ xem và sửa hồ sơ của mình.

**Upload CV (UC08):**

* Chỉ nhận PDF hoặc DOCX, tối đa 5 MB; kiểm tra loại file ở backend, không tin phần mở rộng do client gửi.  
* Đổi tên file ngẫu nhiên, lưu ngoài thư mục public.  
* Viết `StorageService` là interface, bản đầu lưu local; bản sau có thể đổi sang S3/R2.  
* Tải xuống qua endpoint có kiểm quyền: chỉ chủ CV và Recruiter của tin mà ứng viên đã nộp đơn.

**Ứng tuyển và lịch sử (UC09, UC10):**

* Unique `(candidateId, jobId)` (BR-02); chỉ ứng tuyển tin APPROVED chưa đóng (BR-03).  
* Mỗi lần đổi trạng thái ghi một dòng `ApplicationStatusHistory`: ai đổi, từ đâu sang đâu, lúc nào, ghi chú.

**Phía Recruiter (UC16, 17, 18):**

* Danh sách ứng viên theo tin, lọc theo trạng thái; kiểm tra tin đó thuộc Recruiter đang đăng nhập.  
* Viết hàm `canTransition(from, to)` chứa bảng chuyển trạng thái hợp lệ; mọi thay đổi trạng thái đi qua hàm này.  
* Sau khi đổi trạng thái, gọi `NotificationService` của D.  
* Unit test đầy đủ bảng chuyển trạng thái, gồm cả các trường hợp bị từ chối.

### **Thành \- Interviews, Notification, Dashboard**

**Đầu dự án (trong lúc chờ module Applications của C):**

* Dựng `MailService` bằng Nodemailer, dùng Mailtrap khi dev; viết template email cho đổi trạng thái và lịch phỏng vấn.  
* Gửi email không chặn luồng chính; lỗi thì ghi log và retry đơn giản (UC27).  
* Dựng `NotificationService` với hàm `notify(userId, type, payload)` để C và D cùng gọi.

**Khi C có Applications (UC19):**

* Tạo, sửa, hủy lịch phỏng vấn cho đơn từ REVIEWING trở đi và chưa ở trạng thái cuối (BR-07).  
* Lưu thời gian dạng UTC, hiển thị theo múi giờ người dùng.  
* Phối hợp C chốt: tạo lịch có tự chuyển đơn sang INTERVIEW\_SCHEDULED hay không (quyết định ở Giai đoạn 2).

**Mở rộng:** UC26 (ứng viên xem lịch phỏng vấn), UC12 (thông báo in-app), UC20 và UC24 (Dashboard Recruiter và Admin, dùng truy vấn tổng hợp `groupBy` theo trạng thái và theo thời gian).

