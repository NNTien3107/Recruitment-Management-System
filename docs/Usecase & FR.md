1. ## **Danh sách Use case**

| Mã UC | Tên | Actor | FR liên quan | Ưu tiên |
| ----- | ----- | ----- | ----- | ----- |
| UC01 | Đăng ký | Guest | FR-01 | M |
| UC02 | Đăng nhập | Người dùng | FR-02, 05 | M |
| UC03 | Đăng xuất | Người dùng | FR-03 | M |
| UC04 | Làm mới token | Người dùng | FR-04 | M |
| UC05 | Tìm kiếm, lọc việc làm | Guest, Candidate | FR-17→19 | M |
| UC06 | Xem chi tiết việc làm | Guest, Candidate | FR-20 | M |
| UC07 | Quản lý hồ sơ cá nhân | Candidate | FR-08 | M |
| UC08 | Upload, quản lý CV | Candidate | FR-09 | M |
| UC09 | Ứng tuyển | Candidate | FR-10, 11 | M |
| UC10 | Xem lịch sử ứng tuyển | Candidate | FR-12 | M |
| UC11 | Rút đơn ứng tuyển | Candidate | FR-13 | S |
| UC12 | Xem thông báo | Candidate | FR-15 | S |
| UC26 | Xem lịch phỏng vấn | Candidate | FR-14 | S |
| UC13 | Quản lý thông tin công ty | Recruiter | FR-21 | M |
| UC14 | Tạo, sửa, xóa tin tuyển dụng | Recruiter | FR-22, 23 | M |
| UC15 | Đóng tin tuyển dụng | Recruiter | FR-24 | M |
| UC16 | Xem danh sách ứng viên theo tin | Recruiter | FR-25 | M |
| UC17 | Xem hồ sơ, tải CV ứng viên | Recruiter | FR-26 | M |
| UC18 | Cập nhật trạng thái ứng tuyển | Recruiter | FR-27 | M |
| UC19 | Quản lý lịch phỏng vấn | Recruiter | FR-28 | S |
| UC20 | Xem Dashboard tuyển dụng | Recruiter | FR-30 | S |
| UC21 | Quản lý người dùng | Admin | FR-31 | M |
| UC22 | Khóa, mở khóa tài khoản | Admin | FR-32 | M |
| UC23 | Duyệt, từ chối tin tuyển dụng | Admin | FR-33 | M |
| UC24 | Xem Dashboard hệ thống | Admin | FR-34 | S |
| UC25 | Xem nhật ký hoạt động | Admin | FR-35 | S |
| UC27 | Gửi thông báo (email và in-app) | Hệ thống | FR-15, 29 | S |

2. ## **Phạm vi MVP**

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

#### 

3. #### **Function Require**

#### **Nhóm Auth và tài khoản**

| Mã | Yêu cầu | Actor | Ưu tiên |
| ----- | ----- | ----- | ----- |
| FR-01 | Đăng ký tài khoản (chọn vai trò Candidate hoặc Recruiter) với email và mật khẩu | Guest | M |
| FR-02 | Đăng nhập, hệ thống trả access token và refresh token | Mọi vai trò | M |
| FR-03 | Đăng xuất, thu hồi refresh token | Mọi vai trò | M |
| FR-04 | Làm mới access token bằng refresh token | Mọi vai trò | M |
| FR-05 | Tài khoản bị khóa không thể đăng nhập hoặc dùng token cũ | Hệ thống | M |
| FR-06 | Quên mật khẩu / đặt lại mật khẩu qua email | Mọi vai trò | C |
| FR-07 | Xác thực email khi đăng ký | Guest | C |

#### 

#### 

#### 

#### 

#### 

#### **Nhóm Candidate**

| Mã | Yêu cầu | Ưu tiên |
| ----- | ----- | ----- |
| FR-08 | Xem và cập nhật thông tin cá nhân, hồ sơ nghề nghiệp (học vấn, kinh nghiệm, kỹ năng) | M |
| FR-09 | Upload CV (PDF/DOCX), xem danh sách CV, xóa CV, đặt CV mặc định | M |
| FR-10 | Ứng tuyển vào một tin bằng một CV đã upload, kèm thư giới thiệu (tùy chọn) | M |
| FR-11 | Mỗi ứng viên chỉ ứng tuyển **một lần** cho mỗi tin | M |
| FR-12 | Xem lịch sử ứng tuyển và trạng thái hiện tại, kèm lịch sử thay đổi trạng thái | M |
| FR-13 | Rút đơn ứng tuyển khi chưa ở trạng thái cuối | S |
| FR-14 | Xem lịch phỏng vấn của mình | S |
| FR-15 | Nhận và xem thông báo trong hệ thống (in-app) | S |
| FR-16 | Lưu việc làm yêu thích | C |

#### **Nhóm tìm kiếm việc làm (Guest và Candidate)**

| Mã | Yêu cầu | Ưu tiên |
| ----- | ----- | ----- |
| FR-17 | Tìm kiếm tin theo từ khóa (tiêu đề, mô tả) | M |
| FR-18 | Lọc theo kỹ năng, địa điểm, mức lương, loại hình (full-time/part-time/intern), cấp độ | M |
| FR-19 | Sắp xếp (mới nhất, lương) và phân trang | M |
| FR-20 | Xem chi tiết tin và thông tin công ty. Chỉ hiển thị tin **đã được duyệt và đang mở** | M |

#### **Nhóm Recruiter**

| Mã | Yêu cầu | Ưu tiên |
| ----- | ----- | ----- |
| FR-21 | Tạo và cập nhật thông tin công ty (tên, mô tả, website, quy mô, địa chỉ, logo) | M |
| FR-22 | Tạo tin tuyển dụng (trạng thái ban đầu: Draft hoặc Pending) | M |
| FR-23 | Sửa, xóa mềm (soft delete) tin tuyển dụng của chính mình | M |
| FR-24 | Đóng tin tuyển dụng (ngừng nhận hồ sơ) | M |
| FR-25 | Xem danh sách ứng viên của từng tin, lọc theo trạng thái | M |
| FR-26 | Xem hồ sơ ứng viên và tải CV | M |
| FR-27 | Cập nhật trạng thái ứng tuyển theo workflow hợp lệ, có thể ghi chú | M |
| FR-28 | Tạo, sửa, hủy lịch phỏng vấn cho một đơn ứng tuyển | S |
| FR-29 | Gửi email thông báo khi đổi trạng thái hoặc có lịch phỏng vấn | S |
| FR-30 | Dashboard: số tin, số hồ sơ, tỷ lệ theo trạng thái, hồ sơ theo thời gian | S |

#### **Nhóm Admin**

| Mã | Yêu cầu | Ưu tiên |
| ----- | ----- | ----- |
| FR-31 | Xem danh sách, tìm kiếm, lọc người dùng (Candidate, Recruiter) | M |
| FR-32 | Khóa / mở khóa tài khoản | M |
| FR-33 | Duyệt hoặc từ chối tin tuyển dụng (kèm lý do từ chối) | M |
| FR-34 | Xem Dashboard tổng quan (số người dùng, tin, đơn ứng tuyển) | S |
| FR-35 | Xem nhật ký hoạt động hệ thống (audit log) | S |

## 

## **Business Rules**

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