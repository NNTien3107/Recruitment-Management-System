# Recruitment Management System

Nền tảng web kết nối nhà tuyển dụng và ứng viên, quản lý trọn quy trình từ đăng tin, nhận hồ sơ, đổi trạng thái đến phỏng vấn.

> Dự án nhóm 4 người, xây dựng bằng stack TypeScript thống nhất cho cả Frontend và Backend.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Bắt đầu](#bắt-đầu)
- [Biến môi trường](#biến-môi-trường)
- [Scripts thường dùng](#scripts-thường-dùng)
- [API Docs](#api-docs)
- [Quy tắc nghiệp vụ](#quy-tắc-nghiệp-vụ)
- [Quy trình làm việc với Git](#quy-trình-làm-việc-với-git)
- [Thành viên](#thành-viên)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

## Tính năng

### Vai trò người dùng

| Vai trò | Mô tả | Việc chính |
|---------|-------|-----------|
| Guest | Khách chưa đăng nhập | Xem, tìm kiếm việc làm; đăng ký, đăng nhập |
| Candidate | Người tìm việc | Quản lý hồ sơ và CV, ứng tuyển, theo dõi trạng thái |
| Recruiter | Đại diện công ty | Quản lý công ty, tin tuyển dụng, ứng viên, lịch phỏng vấn |
| Admin | Quản trị hệ thống | Quản lý tài khoản, duyệt tin, xem thống kê |

> Mỗi tài khoản Recruiter thuộc đúng một công ty. Gửi email là chức năng của hệ thống, không phải actor.

### Phạm vi MVP (21/27 use case)

- **Auth:** đăng ký, đăng nhập, đăng xuất, làm mới token
- **Công ty & tin tuyển dụng:** quản lý công ty, tạo/sửa/xóa/đóng tin, tìm kiếm và lọc, xem chi tiết việc làm
- **Admin:** quản lý người dùng, khóa/mở khóa, duyệt/từ chối tin
- **Candidate:** hồ sơ cá nhân, upload CV, ứng tuyển, lịch sử ứng tuyển
- **Recruiter xử lý ứng viên:** danh sách ứng viên theo tin, xem hồ sơ và tải CV, cập nhật trạng thái
- **Phỏng vấn & thông báo:** quản lý lịch phỏng vấn, gửi thông báo qua email

**Mở rộng sau MVP:** rút đơn, thông báo in-app, dashboard Recruiter/Admin, nhật ký hoạt động, ứng viên xem lịch phỏng vấn.
**Nâng cao nếu còn thời gian:** quên mật khẩu, xác thực email, lưu việc làm yêu thích.

## Công nghệ sử dụng

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React + Vite, React Router, TanStack Query, React Hook Form + Zod, Tailwind CSS |
| Backend | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT access token (15 phút) + refresh token (7 ngày, httpOnly cookie, lưu hash trong DB) |
| API docs | Swagger (`@nestjs/swagger`) |
| File | Local disk, thông qua interface `StorageService` (có thể đổi sang S3/R2) |
| Email | Nodemailer + SMTP (Mailtrap khi dev) |
| Test | Jest + Supertest (BE), Vitest + Testing Library (FE) |
| DevOps | Git/GitHub, Docker + Docker Compose |

Cố ý không dùng microservices, Redis, message queue, GraphQL, Kubernetes vì không đem lại giá trị tương xứng ở quy mô này.

## Cấu trúc thư mục

```text
<DÁN KẾT QUẢ LỆNH tree VÀO ĐÂY>
```

## Bắt đầu

### Yêu cầu

- Node.js >= 20 (chỉnh theo phiên bản nhóm đang dùng)
- npm
- Docker và Docker Compose
- Git

### Cài đặt

```bash
# 1. Clone repo
git clone <repo-url>
cd <repo>

# 2. Tạo file môi trường
cp .env.example .env                       # biến môi trường cho Docker (Postgres)
cp backend/.env.example backend/.env       # biến môi trường cho Backend
cp frontend/.env.example frontend/.env     # nếu có

# 3. Chạy PostgreSQL (và các service khác) bằng Docker
docker compose up -d

# 4. Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# 5. Frontend (mở terminal khác)
cd frontend
npm install
npm run dev
```

Hoặc chạy cả hệ thống bằng một lệnh:

```bash
docker compose up
```

### Địa chỉ mặc định

| Dịch vụ | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Health check | http://localhost:3000/health |

> Chỉnh lại cổng và đường dẫn cho khớp cấu hình thực tế của dự án.

## Biến môi trường

Sao chép từ `backend/.env.example`. Các biến chính:

| Biến | Ý nghĩa |
|------|---------|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `JWT_ACCESS_SECRET` | Khóa ký access token |
| `JWT_REFRESH_SECRET` | Khóa ký refresh token |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Cấu hình email (Mailtrap khi dev) |
| `CORS_ORIGIN` | Origin của frontend được phép gọi API |

> Không bao giờ commit file `.env`. Chỉ commit `.env.example`.

## Scripts thường dùng

### Backend

```bash
npm run start:dev          # chạy dev, tự reload
npm run build              # build production
npm run lint               # kiểm tra lint
npm run test               # unit test (Jest)
npm run test:e2e           # test end-to-end (Supertest)
npx prisma migrate dev     # tạo/áp dụng migration
npx prisma generate        # sinh lại Prisma Client
npx prisma studio          # giao diện xem dữ liệu
```

### Frontend

```bash
npm run dev                # chạy dev
npm run build              # build production
npm run lint               # kiểm tra lint
npm run test               # test (Vitest)
```

## API Docs

Khi backend đang chạy, truy cập Swagger tại `/api/docs` để xem toàn bộ endpoint và thử trực tiếp.

## Quy tắc nghiệp vụ

| Mã | Quy tắc |
|----|---------|
| BR-01 | Email là duy nhất trong hệ thống |
| BR-02 | Mỗi ứng viên chỉ nộp một đơn cho một tin |
| BR-03 | Không ứng tuyển được tin đã đóng, hết hạn hoặc chưa duyệt |
| BR-04 | Recruiter phải có thông tin công ty trước khi đăng tin |
| BR-05 | Không xóa cứng tin đã có đơn ứng tuyển (soft delete hoặc đóng tin) |
| BR-06 | Tài khoản bị khóa: mọi refresh token bị vô hiệu |
| BR-07 | Chỉ tạo lịch phỏng vấn khi đơn từ REVIEWING trở đi và chưa ở trạng thái cuối |
| BR-08 | Sửa nội dung quan trọng của tin đã APPROVED thì quay về PENDING để duyệt lại |

## Quy trình làm việc với Git

- `main`: **không động vào**. Chỉ merge `develop` → `main` khi hoàn thành sản phẩm cuối cùng.
- `develop`: nhánh tích hợp, chỉ nhận code qua Pull Request từ nhánh feature sau khi đã kiểm tra.
- Mỗi tính năng làm trên nhánh riêng `feature/<module>-<mô-tả>` (hoặc `fix/...`) tách từ `develop`, push lên chính nhánh đó.
- Commit theo Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`...).
- Mỗi PR cần ít nhất 1 người review.

Chi tiết xem [TEAM_GUIDE.md](./TEAM_GUIDE.md).

## Thành viên

| Thành viên | Phạm vi |
|------------|---------|
| Tiến | Auth, RBAC, hạ tầng, audit log |
| Nam | Company, Jobs, Search, Admin |
| Oanh | Candidate, CV, Applications |
| Thành | Interviews, Email, Notification, Dashboard |

## Tài liệu liên quan

- [TEAM_GUIDE.md](./TEAM_GUIDE.md): bàn giao hạ tầng, quy ước code, quy tắc Git
- Tài liệu tổng hợp dự án (Recruitment Management System.pdf)
