# TEAM GUIDE – Bàn giao hạ tầng & module mẫu `users`

> Người viết: Tiến (A) · Cập nhật: 12/11/2026
> Đọc file này trước khi bắt đầu module của bạn.

## 1. Đã hoàn thành (hạ tầng của A)

| # | Hạng mục | Trạng thái |
|---|----------|-----------|
| 1 | Monorepo `/backend` + `/frontend`, ESLint, Prettier, Husky | Xong |
| 2 | `docker-compose.yml` (PostgreSQL + backend + frontend) | Xong |
| 3 | GitHub Actions CI + bảo vệ nhánh | **Chưa làm** (hoãn) |
| 4 | ConfigModule (.env), PrismaService, endpoint `/health` | Xong |
| 5 | ValidationPipe, Exception Filter, Response Interceptor, Swagger | Xong |
| 6 | Module mẫu `users` hoàn chỉnh | Xong |
| 7+ | Auth (UC01–04), JwtAuthGuard, RolesGuard, `@Roles()`, `@CurrentUser()` | **Đang làm** |

## 2. Cách chạy dự án

```bash
git clone <repo-url> && cd <repo>
cp .env.example .env                      # Docker Postgres
cp backend/.env.example backend/.env      # Backend (DATABASE_URL, PORT,...)
docker compose up -d                      # chạy PostgreSQL (+ app)
cd backend
npm install
npx prisma migrate dev                    # áp dụng migration
npm run start:dev
```

- Swagger: `http://localhost:3000/api/docs` (chỉnh theo cấu hình thực tế)
- Health check: `GET /health`

## 3. Cấu trúc thư mục
- Xem trong file tree.txt

## 4. Quy ước chung (bắt buộc tuân theo)

### 4.1 Response format
Mọi response thành công đi qua Response Interceptor, KHÔNG tự bọc lại trong controller. Controller chỉ `return` dữ liệu.

### 4.2 Lỗi
Ném exception chuẩn của NestJS (`NotFoundException`, `ConflictException`, `ForbiddenException`...). Exception Filter sẽ định dạng thống nhất. Không `try/catch` rồi tự trả lỗi.

### 4.3 Validation
- Mọi body/query dùng **DTO + class-validator**; ValidationPipe đã bật global.
- Mỗi DTO có decorator `@ApiProperty()` để Swagger hiển thị đúng.

### 4.4 Cấu trúc một module (theo `users`)
```text
src/modules/<tên>/
├── dto/                  # create-*.dto.ts, update-*.dto.ts, query-*.dto.ts
├── <tên>.controller.ts   # chỉ nhận request, gọi service
├── <tên>.service.ts      # toàn bộ nghiệp vụ + kiểm tra Business Rule
├── <tên>.module.ts
└── <tên>.service.spec.ts # unit test
```
- Controller **mỏng**, logic nằm ở service.
- Truy cập DB qua `PrismaService` (inject), không tạo `PrismaClient` mới.

### 4.4 Quy tắc làm việc với GitHub

**Nguyên tắc chung**
- `main`: **không ai được động vào** (không commit, không push, không tạo PR vào `main`). Chỉ merge `develop` → `main` một lần khi sản phẩm cuối cùng hoàn thành.
- `develop`: nhánh tích hợp. Không commit trực tiếp; chỉ nhận code qua merge từ nhánh feature sau khi đã kiểm tra.
- Mỗi tính năng làm trên **một nhánh riêng**, tách từ `develop`.

**Đặt tên nhánh**

| Loại | Mẫu | Ví dụ |
|------|-----|-------|
| Tính năng | `feature/<module>-<mô-tả-ngắn>` | `feature/jobs-search-filter` |
| Sửa lỗi | `fix/<module>-<mô-tả-ngắn>` | `fix/applications-duplicate-check` |

**Quy trình cho mỗi tính năng**

```bash
# 1. Cập nhật develop mới nhất
git checkout develop
git pull origin develop

# 2. Tạo nhánh riêng cho tính năng
git checkout -b feature/jobs-search-filter

# 3. Code, commit thường xuyên (Conventional Commits)
git add .
git commit -m "feat(jobs): add search filter by keyword and location"

# 4. Push lên chính nhánh đó
git push -u origin feature/jobs-search-filter     # lần đầu
git push                                          # các lần sau

# 5. Trước khi merge: đồng bộ develop vào nhánh của mình, xử lý conflict (nếu có)
git fetch origin
git merge origin/develop
# chạy lại: npm run lint && npm run test && npm run build

# 6. Tạo Pull Request: feature/... → develop (KHÔNG chọn main)
# 7. Có ít nhất 1 người review và approve, rồi mới merge vào develop
# 8. Sau khi merge: xóa nhánh feature, quay về develop và pull lại
git checkout develop
git pull origin develop
git branch -d feature/jobs-search-filter
```

**Checklist trước khi merge vào `develop`**
- [ ] Đã merge `develop` mới nhất vào nhánh của mình và xử lý xong conflict
- [ ] `lint`, `test`, `build` chạy thành công ở máy local
- [ ] Đã chạy thử tính năng thật (qua Swagger/giao diện), không chỉ test
- [ ] Unit test cho các Business Rule liên quan đã có
- [ ] Nếu sửa `schema.prisma`: đã tạo migration và báo cả nhóm
- [ ] PR có mô tả ngắn: làm gì, cách kiểm tra
- [ ] Ít nhất 1 thành viên khác đã review và approve

**Quy ước khác**
- Commit theo Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.
- Husky chạy lint/format trước commit — không dùng `--no-verify`.
- Mỗi nhánh chỉ làm một tính năng/việc, giữ PR nhỏ để dễ review.
- Không `git push --force` lên `develop`/`main`; chỉ được force-push trên nhánh feature của chính mình khi cần.
- Không commit `.env`, file CV upload, `node_modules`. Chỉ commit `.env.example`.
- Merge xong nhớ xóa nhánh feature để repo gọn.

> Ghi chú: bước bảo vệ nhánh (branch protection) và CI trên GitHub chưa cấu hình, nên các quy tắc trên hiện dựa vào sự tự giác của cả nhóm. Khi bật được, nên khóa `main` và `develop` (bắt buộc PR + review).

## 5. Việc từng thành viên có thể làm NGAY (không cần chờ Auth)

### Nam (B) – Company, Jobs, Search, Admin
- Thiết kế schema Prisma: `Company`, `Job` (trạng thái DRAFT/PENDING/APPROVED/CLOSED/REJECTED, `deletedAt`).
- Làm CRUD `Company`, `Jobs`, `GET /jobs` (filter, phân trang, tối đa 50) theo mẫu `users`.
- Viết script seed ~10.000 tin; đánh index các cột lọc.
- Tạm thời **chưa gắn guard**; để chỗ `// TODO: @UseGuards(JwtAuthGuard, RolesGuard)` — gắn sau khi A xong Auth.
- UC22 (khóa/mở khóa) cần hàm thu hồi refresh token của A → làm sau.

### Oanh (C) – Candidate, CV, Applications
- Schema: `CandidateProfile`, `Cv`, `Application` (unique `candidateId + jobId`), `ApplicationStatusHistory`.
- Viết `StorageService` (interface + bản local disk); đây là service dùng chung (Company logo của B cũng dùng) → làm sớm, báo cả nhóm.
- Viết `canTransition(from, to)` + unit test đầy đủ bảng chuyển trạng thái.
- Chờ `Job` của B cho UC09; có thể dùng dữ liệu giả để test.

### Thành (D) – Interviews, Notification, Email
- Dựng `MailService` (Nodemailer + Mailtrap), template email, gửi không chặn luồng chính, retry đơn giản.
- Dựng `NotificationService.notify(userId, type, payload)` để C và D cùng gọi.
- Schema `Interview` (lưu UTC); chờ `Application` của C để làm UC19.

## 6. Việc cần chờ A (sẽ báo khi xong)

| Thứ cần | Dùng cho |
|---------|----------|
| `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()` | Mọi endpoint cần đăng nhập/phân quyền |
| Hàm thu hồi toàn bộ refresh token của user | Nam – UC22 khóa tài khoản (BR-06) |
| Axios instance tự refresh token, `ProtectedRoute` | Toàn bộ frontend |

## 7. Lưu ý khi sửa schema Prisma

1. Cả nhóm dùng chung `schema.prisma` → **dễ xung đột**. Mỗi người chỉ thêm model của mình, thông báo trên nhóm trước khi merge.
2. Đặt tên migration rõ nghĩa: `npx prisma migrate dev --name add_job_model`.
3. Sau khi `git pull` có migration mới: chạy `npx prisma migrate dev` và `npx prisma generate`.
4. Không sửa file migration đã được merge.

## 8. Business Rule – ai chịu trách nhiệm test

Mỗi BR trong tài liệu dự án phải có unit test ở module phụ trách (BR-02/03 → C, BR-04/05/08 → B, BR-07 → D, BR-06 → A+B).

## 9. Hỏi ai

- Hạ tầng, Docker, Auth, guard: Tiến
- Còn lại: hỏi chủ module tương ứng trong nhóm chat.
