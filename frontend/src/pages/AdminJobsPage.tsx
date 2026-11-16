import { useEffect, useState, type FormEvent } from 'react';
import {
  approveAdminJob,
  fetchAdminJobById,
  fetchAdminJobs,
  rejectAdminJob,
} from '../api/admin.api';
import { Pagination } from '../components/Pagination';
import { AppLink } from '../components/Router';
import type { JobItem, JobStatus, PaginationMeta } from '../types/models';
import {
  formatDate,
  formatSalary,
  JOB_LEVEL_LABELS,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
} from '../utils/formatters';

export function AdminJobsPage() {
  // Mặc định lọc trạng thái PENDING để Admin xử lý tin chờ duyệt
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('PENDING');
  const [keyword, setKeyword] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Xem chi tiết thẩm định tin tuyển dụng (GET /api/admin/jobs/:id)
  const [inspectingJob, setInspectingJob] = useState<JobItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Modal nhập lý do từ chối tin tuyển dụng (PATCH /api/admin/jobs/:id/reject)
  const [rejectModalJob, setRejectModalJob] = useState<JobItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadJobs = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchAdminJobs({
          page,
          pageSize: 10,
          status: statusFilter,
          keyword: appliedKeyword || undefined,
        });
        if (!cancelled) {
          setJobs(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Không thể tải danh sách tin tuyển dụng cần kiểm duyệt',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, appliedKeyword, reloadKey]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const handleSwitchStatusTab = (nextStatus: JobStatus | '') => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleOpenInspectDetail = async (jobId: string) => {
    setLoadingDetail(true);
    setErrorMsg(null);
    try {
      const detail = await fetchAdminJobById(jobId);
      setInspectingJob(detail);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải chi tiết tin thẩm định');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApproveJob = async (job: JobItem) => {
    setProcessingId(job.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await approveAdminJob(job.id);
      setSuccessMsg(
        `Đã duyệt thành công tin tuyển dụng "${job.title}"! Tin hiện đã được hiển thị công khai (APPROVED).`,
      );
      if (inspectingJob?.id === job.id) {
        setInspectingJob(null);
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Duyệt tin tuyển dụng thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (job: JobItem) => {
    setRejectModalJob(job);
    setRejectReason('');
    setRejectError(null);
  };

  const handleRejectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectModalJob) return;

    const trimmedReason = rejectReason.trim();
    if (trimmedReason.length < 5) {
      setRejectError('Lý do từ chối phải có ít nhất 5 ký tự.');
      return;
    }

    setProcessingId(rejectModalJob.id);
    setRejectError(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await rejectAdminJob(rejectModalJob.id, trimmedReason);
      setSuccessMsg(`Đã từ chối tin tuyển dụng "${rejectModalJob.title}" kèm lý do phản hồi!`);
      if (inspectingJob?.id === rejectModalJob.id) {
        setInspectingJob(null);
      }
      setRejectModalJob(null);
      setRejectReason('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Từ chối tin tuyển dụng thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status: JobStatus): string => {
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
        {/* Thanh chuyển phân hệ Admin */}
        <div className="rms-admin-nav-tabs">
          <AppLink to="/admin/users" className="rms-admin-tab">
            👥 Quản lý người dùng (UC21 · UC22)
          </AppLink>
          <AppLink to="/admin/jobs" className="rms-admin-tab active">
            📋 Duyệt tin tuyển dụng (UC23)
          </AppLink>
        </div>

        <div className="rms-page-header">
          <div>
            <h1 className="rms-page-title">Thẩm định &amp; Duyệt tin tuyển dụng (UC23 · FR-33)</h1>
            <p className="rms-muted">
              Kiểm duyệt nội dung các tin tuyển dụng ở trạng thái <code>PENDING</code> trước khi cho
              phép hiển thị công khai trên hệ thống.
            </p>
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

        {/* Tabs lọc nhanh theo trạng thái */}
        <div className="rms-status-tabs" role="tablist">
          <button
            type="button"
            className={`rms-status-tab ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => handleSwitchStatusTab('PENDING')}
          >
            ⏳ Chờ duyệt (PENDING)
          </button>
          <button
            type="button"
            className={`rms-status-tab ${statusFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => handleSwitchStatusTab('APPROVED')}
          >
            ✅ Đã duyệt (APPROVED)
          </button>
          <button
            type="button"
            className={`rms-status-tab ${statusFilter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => handleSwitchStatusTab('REJECTED')}
          >
            ❌ Đã từ chối (REJECTED)
          </button>
          <button
            type="button"
            className={`rms-status-tab ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => handleSwitchStatusTab('')}
          >
            📂 Tất cả trạng thái
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <form className="rms-filter-bar" onSubmit={handleSearchSubmit}>
          <div className="rms-filter-bar-left">
            <input
              type="text"
              className="rms-input rms-filter-search-input"
              placeholder="Tìm theo tiêu đề tin hoặc tên công ty..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="rms-btn rms-btn-primary">
              Tìm kiếm
            </button>
            {appliedKeyword && (
              <button
                type="button"
                className="rms-btn rms-btn-outline"
                onClick={() => {
                  setKeyword('');
                  setAppliedKeyword('');
                  setPage(1);
                }}
              >
                Xóa từ khóa
              </button>
            )}
          </div>

          <div className="rms-results-summary">
            Hiển thị: <strong>{meta.total}</strong> tin tuyển dụng
          </div>
        </form>

        {loading ? (
          <div className="rms-loading-state">Đang tải danh sách tin tuyển dụng...</div>
        ) : jobs.length === 0 ? (
          <div className="rms-empty-state">
            <h3>
              {statusFilter === 'PENDING'
                ? 'Không có tin tuyển dụng nào đang chờ duyệt'
                : 'Không tìm thấy tin tuyển dụng phù hợp'}
            </h3>
            <p>
              {statusFilter === 'PENDING'
                ? 'Tất cả các tin tuyển dụng gửi lên đều đã được Admin xử lý.'
                : 'Hãy thử chuyển sang tab trạng thái khác hoặc xóa từ khóa tìm kiếm.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rms-job-list">
              {jobs.map((job) => (
                <article key={job.id} className="rms-job-card">
                  <div className="rms-job-card-logo">
                    {job.company?.logoUrl ? (
                      <img src={job.company.logoUrl} alt={job.company.name} />
                    ) : (
                      <div className="rms-logo-fallback">
                        {(job.company?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="rms-job-card-body">
                    <div className="rms-job-card-header">
                      <div>
                        <div className="rms-job-title-row">
                          <h2 className="rms-job-card-title">{job.title}</h2>
                          <span className={getStatusBadgeClass(job.status)}>
                            {JOB_STATUS_LABELS[job.status]}
                          </span>
                        </div>
                        {job.company && (
                          <AppLink
                            to={`/companies/${job.company.id}`}
                            className="rms-job-card-company"
                          >
                            🏢 {job.company.name}
                          </AppLink>
                        )}
                      </div>

                      <div className="rms-job-card-salary">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </div>
                    </div>

                    {job.status === 'REJECTED' && job.rejectReason && (
                      <div className="rms-reject-reason-box">
                        <strong>Lý do từ chối đã ghi nhận:</strong> {job.rejectReason}
                      </div>
                    )}

                    <div className="rms-job-card-meta">
                      <span className="rms-badge rms-badge-neutral">📍 {job.location}</span>
                      <span className="rms-badge rms-badge-info">
                        💼 {JOB_TYPE_LABELS[job.jobType]}
                      </span>
                      <span className="rms-badge rms-badge-purple">
                        🎯 {JOB_LEVEL_LABELS[job.level]}
                      </span>
                      <span className="rms-badge rms-badge-neutral">
                        ⏳ Hạn nộp: {formatDate(job.deadline)}
                      </span>
                      <span className="rms-badge rms-badge-neutral">
                        🕒 Gửi ngày: {formatDate(job.createdAt)}
                      </span>
                    </div>

                    <div className="rms-job-card-footer">
                      <div className="rms-job-skills">
                        {job.skills.map((skill) => (
                          <span key={skill} className="rms-skill-tag rms-skill-tag-static">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="rms-recruiter-job-actions">
                        <button
                          type="button"
                          className="rms-btn rms-btn-outline rms-btn-sm"
                          disabled={loadingDetail}
                          onClick={() => void handleOpenInspectDetail(job.id)}
                        >
                          👁 Xem chi tiết thẩm định
                        </button>

                        {job.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              className="rms-btn rms-btn-success rms-btn-sm"
                              disabled={processingId === job.id}
                              onClick={() => void handleApproveJob(job)}
                            >
                              {processingId === job.id ? 'Đang xử lý...' : '✅ Duyệt tin'}
                            </button>

                            <button
                              type="button"
                              className="rms-btn rms-btn-danger-outline rms-btn-sm"
                              disabled={processingId === job.id}
                              onClick={() => handleOpenRejectModal(job)}
                            >
                              ❌ Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Pagination meta={meta} onPageChange={(nextPage) => setPage(nextPage)} />
          </>
        )}
      </div>

      {/* Modal Xem chi tiết thẩm định tin tuyển dụng (GET /api/admin/jobs/:id) */}
      {inspectingJob && (
        <div className="rms-modal-backdrop" role="dialog" aria-modal="true">
          <div className="rms-modal rms-modal-lg">
            <div className="rms-form-card-header">
              <div>
                <div className="rms-job-title-row">
                  <h3 className="rms-modal-title" style={{ marginBottom: 0 }}>
                    {inspectingJob.title}
                  </h3>
                  <span className={getStatusBadgeClass(inspectingJob.status)}>
                    {JOB_STATUS_LABELS[inspectingJob.status]}
                  </span>
                </div>
                {inspectingJob.company && (
                  <p className="rms-muted" style={{ marginTop: 4 }}>
                    Công ty: <strong>{inspectingJob.company.name}</strong>
                    {inspectingJob.company.owner && (
                      <>
                        {' '}
                        · Người đăng: <strong>{inspectingJob.company.owner.fullName}</strong> (
                        {inspectingJob.company.owner.email})
                      </>
                    )}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="rms-btn rms-btn-outline rms-btn-sm"
                onClick={() => setInspectingJob(null)}
              >
                ✕ Đóng
              </button>
            </div>

            <div className="rms-inspect-body">
              <div className="rms-detail-badges">
                <span className="rms-badge rms-badge-salary">
                  💰 {formatSalary(inspectingJob.salaryMin, inspectingJob.salaryMax)}
                </span>
                <span className="rms-badge rms-badge-neutral">📍 {inspectingJob.location}</span>
                <span className="rms-badge rms-badge-info">
                  💼 {JOB_TYPE_LABELS[inspectingJob.jobType]}
                </span>
                <span className="rms-badge rms-badge-purple">
                  🎯 {JOB_LEVEL_LABELS[inspectingJob.level]}
                </span>
                <span className="rms-badge rms-badge-neutral">
                  ⏳ Hạn nộp: {formatDate(inspectingJob.deadline)}
                </span>
              </div>

              <div className="rms-inspect-section">
                <h4>Mô tả công việc</h4>
                <div className="rms-prose">{inspectingJob.description}</div>
              </div>

              {inspectingJob.requirements && (
                <div className="rms-inspect-section">
                  <h4>Yêu cầu ứng viên</h4>
                  <div className="rms-prose">{inspectingJob.requirements}</div>
                </div>
              )}

              {inspectingJob.benefits && (
                <div className="rms-inspect-section">
                  <h4>Quyền lợi</h4>
                  <div className="rms-prose">{inspectingJob.benefits}</div>
                </div>
              )}

              <div className="rms-inspect-section">
                <h4>Kỹ năng yêu cầu</h4>
                <div className="rms-job-skills">
                  {inspectingJob.skills.map((sk) => (
                    <span key={sk} className="rms-skill-tag rms-skill-tag-static">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rms-modal-actions">
              <button
                type="button"
                className="rms-btn rms-btn-outline"
                onClick={() => setInspectingJob(null)}
              >
                Đóng cửa sổ
              </button>

              {inspectingJob.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    className="rms-btn rms-btn-danger-outline"
                    onClick={() => handleOpenRejectModal(inspectingJob)}
                  >
                    ❌ Từ chối tin này
                  </button>
                  <button
                    type="button"
                    className="rms-btn rms-btn-success"
                    disabled={processingId === inspectingJob.id}
                    onClick={() => void handleApproveJob(inspectingJob)}
                  >
                    {processingId === inspectingJob.id ? 'Đang duyệt...' : '✅ Duyệt tin ngay'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal bắt buộc nhập lý do từ chối tin tuyển dụng (UC23, FR-33) */}
      {rejectModalJob && (
        <div className="rms-modal-backdrop" role="dialog" aria-modal="true">
          <div className="rms-modal">
            <h3 className="rms-modal-title">Từ chối tin tuyển dụng (UC23 · FR-33)</h3>
            <p className="rms-modal-body">
              Vui lòng nhập lý do từ chối cho tin{' '}
              <strong>&ldquo;{rejectModalJob.title}&rdquo;</strong> để Nhà tuyển dụng nắm được và
              chỉnh sửa lại nội dung:
            </p>

            {rejectError && (
              <div className="rms-alert rms-alert-error" style={{ marginBottom: 14 }}>
                <span>⚠️ {rejectError}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleRejectSubmit(e)}>
              <div className="rms-field" style={{ marginBottom: 18 }}>
                <label htmlFor="reject-reason-input" className="rms-label">
                  Lý do từ chối (5 – 500 ký tự) <span className="rms-required">*</span>
                </label>
                <textarea
                  id="reject-reason-input"
                  rows={4}
                  required
                  minLength={5}
                  maxLength={500}
                  className="rms-textarea"
                  placeholder="VD: Nội dung mô tả công việc chưa rõ ràng, thiếu thông tin yêu cầu chuyên môn..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <span className="rms-muted" style={{ fontSize: 12 }}>
                  Đã nhập {rejectReason.trim().length}/500 ký tự
                </span>
              </div>

              <div className="rms-modal-actions">
                <button
                  type="button"
                  className="rms-btn rms-btn-outline"
                  disabled={processingId === rejectModalJob.id}
                  onClick={() => setRejectModalJob(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rms-btn rms-btn-danger"
                  disabled={processingId === rejectModalJob.id}
                >
                  {processingId === rejectModalJob.id ? 'Đang gửi...' : 'Xác nhận Từ chối tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
