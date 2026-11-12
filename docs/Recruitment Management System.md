# **Recruitment Management System \- Tài liệu tổng hợp dự án**

1. ## **Tổng quan**

Dự án xây dựng nền tảng web kết nối nhà tuyển dụng và ứng viên, quản lý trọn quy trình từ đăng tin, nhận hồ sơ, đổi trạng thái đến phỏng vấn.

| Actor | Là ai | Việc chính |
| ----- | ----- | ----- |
| Guest | Khách chưa đăng nhập | Xem, tìm kiếm việc làm; đăng ký, đăng nhập |
| Candidate | Người tìm việc | Quản lý hồ sơ và CV, ứng tuyển, theo dõi trạng thái |
| Recruiter | Đại diện công ty | Quản lý công ty, tin tuyển dụng, ứng viên, lịch phỏng vấn |
| Admin | Quản trị hệ thống | Quản lý tài khoản, duyệt tin, xem thống kê |

Quy ước: mỗi tài khoản Recruiter thuộc đúng một công ty. Gửi email là chức năng của hệ thống, không phải actor.

2. ## **Tech Stack**

Nhóm đã chốt một stack TypeScript thống nhất, dùng chung ngôn ngữ cho cả Frontend và Backend.

| Lớp | Công nghệ | Lý do chọn |
| ----- | ----- | ----- |
| Frontend | React \+ Vite, React Router, TanStack Query, React Hook Form \+ Zod, Tailwind CSS | React phổ biến nhất trong tin tuyển dụng Fresher/Junior; TanStack Query xử lý loading, error, cache gọn |
| Backend | NestJS | Kiến trúc module, Guard, Pipe, Filter rõ ràng, phù hợp RBAC và validation |
| Database | PostgreSQL | Ràng buộc dữ liệu mạnh, enum, index tốt |
| ORM | Prisma | Schema dễ đọc, migration tốt, type-safe |
| Auth | JWT access token (15 phút) \+ refresh token (7 ngày, httpOnly cookie, lưu hash trong DB) | Chuẩn thực tế, tránh lưu token nhạy cảm ở localStorage |
| API docs | Swagger (`@nestjs/swagger`) | Tự sinh từ code |
| File | Local disk sau interface `StorageService` | Đơn giản khi dev, sau này đổi sang S3/R2 mà không sửa nghiệp vụ |
| Email | Nodemailer \+ SMTP (Mailtrap khi dev) | Đủ dùng, không cần hệ thống phức tạp |
| Test | Jest \+ Supertest (BE), Vitest \+ Testing Library (FE) | Cùng hệ sinh thái |
| DevOps | Git/GitHub, GitHub Actions, Docker \+ Docker Compose | CI mỗi Pull Request, chạy cả hệ thống bằng một lệnh |

Cố ý không dùng microservices, Redis, message queue, GraphQL, Kubernetes vì không đem lại giá trị tương xứng ở quy mô này.

3. ## **Phạm vi MVP**

MVP gồm **21 use case** trong tổng số 27 use case. Nhóm chọn đưa thêm UC19 (lịch phỏng vấn) và UC27 (gửi thông báo) vào MVP để phần việc của D có nội dung thật từ sớm.

| Nhóm | Use case MVP | Phụ trách |
| ----- | ----- | ----- |
| Auth | UC01 Đăng ký, UC02 Đăng nhập, UC03 Đăng xuất, UC04 Làm mới token | Tiến |
| Công ty, tin tuyển dụng, tìm kiếm | UC13 Quản lý công ty, UC14 Tạo/sửa/xóa tin, UC15 Đóng tin, UC05 Tìm kiếm và lọc, UC06 Xem chi tiết việc làm | Nam |
| Admin | UC21 Quản lý người dùng, UC22 Khóa/mở khóa, UC23 Duyệt/từ chối tin | Nam |
| Candidate | UC07 Hồ sơ cá nhân, UC08 Upload CV, UC09 Ứng tuyển, UC10 Lịch sử ứng tuyển | Oanh |
| Ứng viên phía Recruiter | UC16 Danh sách ứng viên theo tin, UC17 Xem hồ sơ và tải CV, UC18 Cập nhật trạng thái | Oanh |
| Phỏng vấn và thông báo | UC19 Quản lý lịch phỏng vấn, UC27 Gửi thông báo (email) | Thành |

**Mở rộng sau MVP (6 use case):** UC11 Rút đơn, UC12 Xem thông báo in-app, UC20 Dashboard Recruiter, UC24 Dashboard Admin, UC25 Nhật ký hoạt động, UC26 Ứng viên xem lịch phỏng vấn.

**Nâng cao nếu còn thời gian:** quên mật khẩu, xác thực email, lưu việc làm yêu thích.

4. ## **Business Rules**

Các quy tắc này trở thành ràng buộc trong Database và logic trong service; người phụ trách module liên quan phải có test cho từng quy tắc.

| Mã | Quy tắc | Thực hiện ở |
| ----- | ----- | ----- |
| BR-01 | Email là duy nhất trong hệ thống | Unique index `users.email` |
| BR-02 | Mỗi ứng viên chỉ nộp một đơn cho một tin | Unique `(candidateId, jobId)` |
| BR-03 | Không ứng tuyển được tin đã đóng, hết hạn hoặc chưa duyệt | Kiểm tra trong `ApplicationsService` |
| BR-04 | Recruiter phải có thông tin công ty trước khi đăng tin | Kiểm tra trong `JobsService` |
| BR-05 | Không xóa cứng tin đã có đơn ứng tuyển | Soft delete (`deletedAt`) hoặc đóng tin |
| BR-06 | Tài khoản bị khóa: mọi refresh token bị vô hiệu | `AuthService` thu hồi token khi Admin khóa |
| BR-07 | Chỉ tạo lịch phỏng vấn khi đơn từ REVIEWING trở đi và chưa ở trạng thái cuối | Kiểm tra trong `InterviewsService` |
| BR-08 | Sửa nội dung quan trọng của tin đã APPROVED thì quay về PENDING để duyệt lại | `JobsService.update` |

## 

5. ## **Phân công nhiệm vụ**

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

