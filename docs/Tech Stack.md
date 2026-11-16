## **Tech Stack**

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

