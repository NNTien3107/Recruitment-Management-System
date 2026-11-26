import { useEffect, useState, type FormEvent } from 'react';
import {
  approveAdminJob,
  fetchAdminJobs,
  fetchAdminUsers,
  lockAdminUser,
  rejectAdminJob,
  unlockAdminUser,
  type AdminUserItem,
} from '../api/admin.api';
import { Pagination } from '../components/Pagination';
import { AppLink } from '../components/Router';
import type { JobItem, JobStatus, PaginationMeta, Role } from '../types/models';
import {
  formatDate,
  formatSalary,
  JOB_LEVEL_LABELS,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
} from '../utils/formatters';

interface AdminPageProps {
  initialTab?: 'jobs' | 'users';
}

const ROLE_LABELS: Record<Role, string> = {
  CANDIDATE: 'Ứng viên (Candidate)',
  RECRUITER: 'Nhà tuyển dụng (Recruiter)',
  ADMIN: 'Quản trị viên (Admin)',
};

export function AdminPage({ initialTab = 'jobs' }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'users'>(initialTab);

  // Thông báo chung
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ==================== State Tab 1: Kiểm duyệt Tin tuyển dụng (UC23) ====================
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatus | ''>('PENDING');
  const [jobKeywordInput, setJobKeywordInput] = useState<string>('');
  const [appliedJobKeyword, setAppliedJobKeyword] = useState<string>('');
  const [jobsPage, setJobsPage] = useState<number>(1);
  const [jobsReloadKey, setJobsReloadKey] = useState<number>(0);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsMeta, setJobsMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  // Modal từ chối tin kèm lý do (UC23, FR-33)
  const [rejectingJob, setRejectingJob] = useState<JobItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // ==================== State Tab 2: Quản lý Người dùng (UC21, UC22) ====================
  const [userRoleFilter, setUserRoleFilter] = useState<Role | ''>('');
  const [userLockFilter, setUserLockFilter] = useState<'true' | 'false' | ''>('');
  const [userKeywordInput, setUserKeywordInput] = useState<string>('');
  const [appliedUserKeyword, setAppliedUserKeyword] = useState<string>('');
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersReloadKey, setUsersReloadKey] = useState<number>(0);

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // Tải danh sách tin tuyển dụng cho Admin (UC23)
  useEffect(() => {
    if (activeTab !== 'jobs') return;
    let cancelled = false;

    const loadJobs = async () => {
      setLoadingJobs(true);
      setErrorMsg(null);
      try {
        const res = await fetchAdminJobs({
          page: jobsPage,
          pageSize: 10,
          status: jobStatusFilter,
          keyword: appliedJobKeyword || undefined,
        });
        if (!cancelled) {
          setJobs(res.data);
          setJobsMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Không thể tải danh sách tin tuyển dụng',
          );
        }
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    };

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, [activeTab, jobsPage, jobStatusFilter, appliedJobKeyword, jobsReloadKey]);

  // Tải danh sách người dùng cho Admin (UC21)
  useEffect(() => {
    if (activeTab !== 'users') return;
    let cancelled = false;

    const loadUsers = async () => {
      setLoadingUsers(true);
      setErrorMsg(null);
      try {
        const res = await fetchAdminUsers({
          page: usersPage,
          pageSize: 10,
          role: userRoleFilter,
          isLocked: userLockFilter,
          keyword: appliedUserKeyword || undefined,
        });
        if (!cancelled) {
          setUsers(res.data);
          setUsersMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng');
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [activeTab, usersPage, userRoleFilter, userLockFilter, appliedUserKeyword, usersReloadKey]);

  const handleJobSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setJobsPage(1);
    setAppliedJobKeyword(jobKeywordInput.trim());
  };

  const handleUserSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setUsersPage(1);
    setAppliedUserKeyword(userKeywordInput.trim());
  };

  const handleApproveJob = async (job: JobItem) => {
    setProcessingJobId(job.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await approveAdminJob(job.id);
      setSuccessMsg(`Đã duyệt tin tuyển dụng "${job.title}" (hiển thị công khai)!`);
      setJobsReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Duyệt tin tuyển dụng thất bại');
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleOpenRejectModal = (job: JobItem) => {
    setRejectingJob(job);
    setRejectReason('');
    setErrorMsg(null);
  };

  const handleConfirmRejectJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectingJob) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      setErrorMsg('Lý do từ chối phải có ít nhất 5 ký tự.');
      return;
    }

    setProcessingJobId(rejectingJob.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await rejectAdminJob(rejectingJob.id, trimmed);
      setSuccessMsg(`Đã từ chối tin tuyển dụng "${rejectingJob.title}" kèm lý do.`);
      setRejectingJob(null);
      setRejectReason('');
      setJobsReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Từ chối tin tuyển dụng thất bại');
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleToggleUserLock = async (targetUser: AdminUserItem) => {
    setProcessingUserId(targetUser.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (targetUser.isLocked) {
        await unlockAdminUser(targetUser.id);
        setSuccessMsg(`Đã mở khóa tài khoản "${targetUser.email}" (UC22).`);
      } else {
        await lockAdminUser(targetUser.id);
        setSuccessMsg(
          `Đã khóa tài khoản "${targetUser.email}" và thu hồi toàn bộ Refresh Token của tài khoản này (UC22, BR-06).`,
        );
      }
      setUsersReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Cập nhật trạng thái tài khoản thất bại');
    } finally {
      setProcessingUserId(null);
    }
  };

  const getJobStatusBadgeClass = (status: JobStatus): string => {
    switch (status) {
      case 'APPROVED':
        return 'rms-badge rms-badge-status-approved';
      case 'PENDING':
        return 'rms-badge rms-badge-status-pending';
      case 'REJECTED':
        return 'rms-badge rms-badge-status-rejected';
      case 'CLOSED':
        return 'rms-badge rms-badge-status-closed';
      case 'DRAFT':
      default:
        return 'rms-badge rms-badge-status-draft';
    }
  };

  return (
    <div className="rms-page">
      <div className="rms-container rms-page-section">
        <div className="rms-page-header">
          <div>
            <h1 className="rms-page-title">Bảng điều khiển Quản trị viên (Admin)</h1>
            <p className="rms-muted">
              Kiểm duyệt tin tuyển dụng (UC23) và Quản lý, khóa/mở khóa tài khoản người dùng (UC21 ·
              UC22 · BR-06)
            </p>
          </div>

          <div className="rms-header-actions">
            <button
              type="button"
              className={`rms-btn ${activeTab === 'jobs' ? 'rms-btn-primary' : 'rms-btn-outline'}`}
              onClick={() => {
                setActiveTab('jobs');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              📋 Duyệt tin tuyển dụng (UC23)
            </button>
            <button
              type="button"
              className={`rms-btn ${activeTab === 'users' ? 'rms-btn-primary' : 'rms-btn-outline'}`}
              onClick={() => {
                setActiveTab('users');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              👥 Quản lý người dùng (UC21 · UC22)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rms-alert rms-alert-error" role="alert">
            <span>⚠️ {errorMsg}</span>
            <button
              type="button"
              className="rms-btn rms-btn-outline rms-btn-sm"
              onClick={() => setErrorMsg(null)}
            >
              Đóng
            </button>
          </div>
        )}

        {successMsg && (
          <div className="rms-alert rms-alert-success" role="status">
            <span>✅ {successMsg}</span>
            <button
              type="button"
              className="rms-btn rms-btn-outline rms-btn-sm"
              onClick={() => setSuccessMsg(null)}
            >
              Đóng
            </button>
          </div>
        )}

        {/* ==================== TAB 1: KIỂM DUYỆT TIN TUYỂN DỤNG (UC23) ==================== */}
        {activeTab === 'jobs' && (
          <div>
            <section className="rms-card" style={{ marginBottom: 20 }}>
              <form onSubmit={handleJobSearchSubmit} className="rms-filter-bar">
                <div className="rms-form-group" style={{ flex: 2, minWidth: 220 }}>
                  <label className="rms-label" htmlFor="admin-job-keyword">
                    Tìm theo tiêu đề hoặc công ty
                  </label>
                  <input
                    id="admin-job-keyword"
                    type="text"
                    className="rms-input"
                    placeholder="Nhập tiêu đề tin hoặc tên công ty..."
                    value={jobKeywordInput}
                    onChange={(e) => setJobKeywordInput(e.target.value)}
                  />
                </div>

                <div className="rms-form-group" style={{ flex: 1, minWidth: 180 }}>
                  <label className="rms-label" htmlFor="admin-job-status">
                    Trạng thái tin
                  </label>
                  <select
                    id="admin-job-status"
                    className="rms-select"
                    value={jobStatusFilter}
                    onChange={(e) => {
                      setJobStatusFilter(e.target.value as JobStatus | '');
                      setJobsPage(1);
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PENDING">⏳ Chờ duyệt (PENDING)</option>
                    <option value="APPROVED">✅ Đã duyệt (APPROVED)</option>
                    <option value="REJECTED">❌ Bị từ chối (REJECTED)</option>
                    <option value="DRAFT">📝 Bản nháp (DRAFT)</option>
                    <option value="CLOSED">🔒 Đã đóng (CLOSED)</option>
                  </select>
                </div>

                <div className="rms-form-actions" style={{ alignSelf: 'flex-end' }}>
                  <button type="submit" className="rms-btn rms-btn-primary">
                    🔍 Lọc tin
                  </button>
                </div>
              </form>
            </section>

            {/* Hộp thoại nhập lý do từ chối tin (FR-33) */}
            {rejectingJob && (
              <section
                className="rms-card"
                style={{
                  marginBottom: 20,
                  border: '2px solid #ef4444',
                  backgroundColor: '#fef2f2',
                }}
              >
                <h3 className="rms-card-title" style={{ color: '#b91c1c' }}>
                  ❌ Từ chối tin tuyển dụng: {rejectingJob.title}
                </h3>
                <form onSubmit={handleConfirmRejectJob}>
                  <div className="rms-form-group">
                    <label className="rms-label" htmlFor="reject-reason-input">
                      Lý do từ chối (bắt buộc, 5 - 500 ký tự) *
                    </label>
                    <textarea
                      id="reject-reason-input"
                      className="rms-textarea"
                      rows={3}
                      required
                      minLength={5}
                      maxLength={500}
                      placeholder="Nhập lý do cụ thể để Nhà tuyển dụng chỉnh sửa lại tin..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="rms-form-actions" style={{ marginTop: 12 }}>
                    <button
                      type="submit"
                      className="rms-btn rms-btn-danger"
                      disabled={processingJobId === rejectingJob.id}
                    >
                      {processingJobId === rejectingJob.id
                        ? 'Đang xử lý...'
                        : 'Xác nhận Từ chối tin'}
                    </button>
                    <button
                      type="button"
                      className="rms-btn rms-btn-outline"
                      onClick={() => setRejectingJob(null)}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              </section>
            )}

            {loadingJobs ? (
              <div className="rms-loading-state">Đang tải danh sách tin tuyển dụng...</div>
            ) : jobs.length === 0 ? (
              <div className="rms-empty-state">
                <h3>Không có tin tuyển dụng nào khớp với bộ lọc</h3>
                <p>Hãy thử chuyển bộ lọc trạng thái sang "Tất cả trạng thái".</p>
              </div>
            ) : (
              <div className="rms-job-list">
                {jobs.map((job) => (
                  <article key={job.id} className="rms-job-card">
                    <div className="rms-job-card-main">
                      <div className="rms-job-card-info">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span className={getJobStatusBadgeClass(job.status)}>
                            {JOB_STATUS_LABELS[job.status]}
                          </span>
                          <h3 className="rms-job-card-title" style={{ margin: 0 }}>
                            {job.title}
                          </h3>
                        </div>

                        <p className="rms-job-card-company" style={{ marginTop: 6 }}>
                          🏢 Công ty:{' '}
                          {job.company ? (
                            <AppLink to={`/companies/${job.company.id}`}>
                              <strong>{job.company.name}</strong>
                            </AppLink>
                          ) : (
                            'Không rõ'
                          )}
                        </p>

                        <div className="rms-job-card-meta">
                          <span className="rms-badge rms-badge-salary">
                            💰 {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                          <span className="rms-badge rms-badge-location">📍 {job.location}</span>
                          <span className="rms-badge rms-badge-info">
                            {JOB_TYPE_LABELS[job.jobType]}
                          </span>
                          <span className="rms-badge rms-badge-purple">
                            {JOB_LEVEL_LABELS[job.level]}
                          </span>
                          <span className="rms-badge rms-badge-neutral">
                            📅 Ngày tạo: {formatDate(job.createdAt)}
                          </span>
                        </div>

                        {job.rejectReason && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: '8px 12px',
                              borderRadius: 6,
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontSize: 13,
                            }}
                          >
                            <strong>Lý do từ chối:</strong> {job.rejectReason}
                          </div>
                        )}
                      </div>

                      <div className="rms-job-card-actions">
                        {job.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              className="rms-btn rms-btn-primary rms-btn-sm"
                              disabled={processingJobId === job.id}
                              onClick={() => void handleApproveJob(job)}
                            >
                              {processingJobId === job.id ? 'Đang duyệt...' : '✅ Duyệt tin'}
                            </button>
                            <button
                              type="button"
                              className="rms-btn rms-btn-danger rms-btn-sm"
                              disabled={processingJobId === job.id}
                              onClick={() => handleOpenRejectModal(job)}
                            >
                              ❌ Từ chối
                            </button>
                          </>
                        )}
                        {job.status === 'APPROVED' && (
                          <AppLink
                            to={`/jobs/${job.id}`}
                            className="rms-btn rms-btn-outline rms-btn-sm"
                          >
                            👁 Xem tin công khai
                          </AppLink>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Pagination meta={jobsMeta} onPageChange={(nextPage) => setJobsPage(nextPage)} />
          </div>
        )}

        {/* ==================== TAB 2: QUẢN LÝ NGƯỜI DÙNG (UC21 · UC22) ==================== */}
        {activeTab === 'users' && (
          <div>
            <section className="rms-card" style={{ marginBottom: 20 }}>
              <form onSubmit={handleUserSearchSubmit} className="rms-filter-bar">
                <div className="rms-form-group" style={{ flex: 2, minWidth: 220 }}>
                  <label className="rms-label" htmlFor="admin-user-keyword">
                    Tìm theo Email hoặc Họ tên
                  </label>
                  <input
                    id="admin-user-keyword"
                    type="text"
                    className="rms-input"
                    placeholder="Nhập email hoặc họ tên người dùng..."
                    value={userKeywordInput}
                    onChange={(e) => setUserKeywordInput(e.target.value)}
                  />
                </div>

                <div className="rms-form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="rms-label" htmlFor="admin-user-role">
                    Vai trò
                  </label>
                  <select
                    id="admin-user-role"
                    className="rms-select"
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value as Role | '');
                      setUsersPage(1);
                    }}
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="CANDIDATE">Ứng viên (CANDIDATE)</option>
                    <option value="RECRUITER">Nhà tuyển dụng (RECRUITER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>

                <div className="rms-form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="rms-label" htmlFor="admin-user-locked">
                    Trạng thái khóa
                  </label>
                  <select
                    id="admin-user-locked"
                    className="rms-select"
                    value={userLockFilter}
                    onChange={(e) => {
                      setUserLockFilter(e.target.value as 'true' | 'false' | '');
                      setUsersPage(1);
                    }}
                  >
                    <option value="">Tất cả</option>
                    <option value="false">🟢 Đang hoạt động</option>
                    <option value="true">🔴 Đã bị khóa</option>
                  </select>
                </div>

                <div className="rms-form-actions" style={{ alignSelf: 'flex-end' }}>
                  <button type="submit" className="rms-btn rms-btn-primary">
                    🔍 Lọc người dùng
                  </button>
                </div>
              </form>
            </section>

            {loadingUsers ? (
              <div className="rms-loading-state">Đang tải danh sách người dùng...</div>
            ) : users.length === 0 ? (
              <div className="rms-empty-state">
                <h3>Không tìm thấy người dùng nào</h3>
                <p>Hãy thử thay đổi từ khóa hoặc bộ lọc vai trò.</p>
              </div>
            ) : (
              <div className="rms-job-list">
                {users.map((u) => (
                  <article key={u.id} className="rms-job-card">
                    <div className="rms-job-card-main">
                      <div className="rms-job-card-info">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            className={`rms-badge ${
                              u.isLocked ? 'rms-badge-status-rejected' : 'rms-badge-status-approved'
                            }`}
                          >
                            {u.isLocked ? '🔴 Đã khóa' : '🟢 Đang hoạt động'}
                          </span>
                          <span className="rms-badge rms-badge-info">{ROLE_LABELS[u.role]}</span>
                          <h3 className="rms-job-card-title" style={{ margin: 0 }}>
                            {u.fullName}
                          </h3>
                        </div>

                        <p className="rms-job-card-company" style={{ marginTop: 6 }}>
                          ✉️ Email: <strong>{u.email}</strong>
                          {u.company && (
                            <>
                              {' '}
                              · 🏢 Công ty:{' '}
                              <AppLink to={`/companies/${u.company.id}`}>
                                <strong>{u.company.name}</strong>
                              </AppLink>
                            </>
                          )}
                        </p>

                        <div className="rms-job-card-meta">
                          <span className="rms-badge rms-badge-neutral">
                            📅 Ngày tham gia: {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="rms-job-card-actions">
                        {u.role !== 'ADMIN' ? (
                          <button
                            type="button"
                            className={`rms-btn rms-btn-sm ${
                              u.isLocked ? 'rms-btn-primary' : 'rms-btn-danger'
                            }`}
                            disabled={processingUserId === u.id}
                            onClick={() => void handleToggleUserLock(u)}
                          >
                            {processingUserId === u.id
                              ? 'Đang xử lý...'
                              : u.isLocked
                                ? '🔓 Mở khóa tài khoản'
                                : '🔒 Khóa tài khoản'}
                          </button>
                        ) : (
                          <span className="rms-badge rms-badge-neutral">Tài khoản Admin</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Pagination meta={usersMeta} onPageChange={(nextPage) => setUsersPage(nextPage)} />
          </div>
        )}
      </div>
    </div>
  );
}
