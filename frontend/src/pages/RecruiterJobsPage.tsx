import { useEffect, useState, type FormEvent } from 'react';
import { fetchMyCompany } from '../api/companies.api';
import {
  closeJob,
  createJob,
  deleteJob,
  fetchRecruiterJobs,
  updateJob,
  type CreateJobPayload,
} from '../api/jobs.api';
import { Pagination } from '../components/Pagination';
import { AppLink } from '../components/Router';
import { useAuth } from '../features/auth/auth-context';
import type {
  CompanyDetail,
  JobItem,
  JobLevel,
  JobStatus,
  JobType,
  PaginationMeta,
} from '../types/models';
import {
  formatDate,
  formatSalary,
  JOB_LEVEL_LABELS,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  LOCATION_OPTIONS,
} from '../utils/formatters';
import { getStoredRecruiterId } from '../utils/recruiter-context';

const SUGGESTED_SKILLS = [
  'NodeJS',
  'NestJS',
  'React',
  'TypeScript',
  'PostgreSQL',
  'Docker',
  'AWS',
  'Python',
  'Java',
];

interface JobFormState {
  title: string;
  location: string;
  jobType: JobType;
  level: JobLevel;
  skillsText: string;
  salaryMin: string;
  salaryMax: string;
  deadline: string;
  description: string;
  requirements: string;
  benefits: string;
  initialStatus: 'DRAFT' | 'PENDING';
}

const DEFAULT_JOB_FORM: JobFormState = {
  title: '',
  location: 'Hà Nội',
  jobType: 'FULL_TIME',
  level: 'JUNIOR',
  skillsText: '',
  salaryMin: '',
  salaryMax: '',
  deadline: '',
  description: '',
  requirements: '',
  benefits: '',
  initialStatus: 'PENDING',
};

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function jobToFormState(job: JobItem): JobFormState {
  return {
    title: job.title,
    location: job.location,
    jobType: job.jobType,
    level: job.level,
    skillsText: job.skills.join(', '),
    salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
    salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
    deadline: toDateInputValue(job.deadline),
    description: job.description || '',
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    initialStatus: job.status === 'DRAFT' ? 'DRAFT' : 'PENDING',
  };
}

export function RecruiterJobsPage() {
  const { user } = useAuth();
  const ownerId = user?.id ?? getStoredRecruiterId();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [checkingCompany, setCheckingCompany] = useState<boolean>(false);

  // Bộ lọc danh sách tin của công ty
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [keyword, setKeyword] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Danh sách tin tuyển dụng
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);

  // Trạng thái mở form Tạo / Sửa tin
  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [form, setForm] = useState<JobFormState>(DEFAULT_JOB_FORM);
  const [saving, setSaving] = useState<boolean>(false);

  // Hộp thoại xác nhận Đóng tin / Xóa mềm tin
  const [confirmAction, setConfirmAction] = useState<{
    type: 'close' | 'delete';
    job: JobItem;
  } | null>(null);
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // Thông báo
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [candidateTodoJob, setCandidateTodoJob] = useState<JobItem | null>(null);

  // 1. Kiểm tra công ty của Recruiter (BR-04)
  useEffect(() => {
    if (!ownerId) {
      return;
    }

    let cancelled = false;
    const loadCompanyAndJobs = async () => {
      setCheckingCompany(true);
      setErrorMsg(null);
      try {
        const myCompany = await fetchMyCompany();
        if (cancelled) return;
        setCompany(myCompany);

        if (myCompany) {
          setLoadingJobs(true);
          const jobsResponse = await fetchRecruiterJobs({
            page,
            pageSize: 10,
            status: statusFilter,
            keyword: appliedKeyword || undefined,
          });
          if (!cancelled) {
            setJobs(jobsResponse.data);
            setMeta(jobsResponse.meta);
          }
        } else {
          setJobs([]);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Không thể tải dữ liệu tin tuyển dụng');
        }
      } finally {
        if (!cancelled) {
          setCheckingCompany(false);
          setLoadingJobs(false);
        }
      }
    };

    void loadCompanyAndJobs();
    return () => {
      cancelled = true;
    };
  }, [ownerId, page, statusFilter, appliedKeyword, reloadKey]);

  const handleOpenCreateForm = () => {
    setEditingJob(null);
    setForm(DEFAULT_JOB_FORM);
    setFormMode('create');
    setErrorMsg(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditForm = (job: JobItem) => {
    setEditingJob(job);
    setForm(jobToFormState(job));
    setFormMode('edit');
    setErrorMsg(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setFormMode('closed');
    setEditingJob(null);
  };

  const handleFieldChange = <K extends keyof JobFormState>(field: K, value: JobFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleSuggestedSkill = (skill: string) => {
    const current = form.skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.some((s) => s.toLowerCase() === skill.toLowerCase());
    const next = exists
      ? current.filter((s) => s.toLowerCase() !== skill.toLowerCase())
      : [...current, skill];
    handleFieldChange('skillsText', next.join(', '));
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const skillsArray = form.skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (form.title.trim().length < 3) {
      setErrorMsg('Tiêu đề tin tuyển dụng phải có ít nhất 3 ký tự.');
      return;
    }

    if (form.description.trim().length < 10) {
      setErrorMsg('Mô tả công việc phải có ít nhất 10 ký tự.');
      return;
    }

    if (skillsArray.length === 0) {
      setErrorMsg('Vui lòng nhập hoặc chọn ít nhất 1 kỹ năng yêu cầu.');
      return;
    }

    const minVal = form.salaryMin.trim() !== '' ? Number(form.salaryMin) : undefined;
    const maxVal = form.salaryMax.trim() !== '' ? Number(form.salaryMax) : undefined;

    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      setErrorMsg('Mức lương tối thiểu không được lớn hơn mức lương tối đa.');
      return;
    }

    const basePayload: Omit<CreateJobPayload, 'recruiterId'> = {
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim() || undefined,
      benefits: form.benefits.trim() || undefined,
      location: form.location.trim(),
      skills: skillsArray,
      salaryMin: minVal,
      salaryMax: maxVal,
      jobType: form.jobType,
      level: form.level,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
    };

    setSaving(true);
    try {
      if (formMode === 'create') {
        await createJob({
          recruiterId: ownerId,
          ...basePayload,
          status: form.initialStatus,
        });
        setSuccessMsg(
          form.initialStatus === 'PENDING'
            ? 'Đã tạo tin tuyển dụng và gửi chờ Admin duyệt (PENDING)!'
            : 'Đã lưu tin tuyển dụng dưới dạng Bản nháp (DRAFT)!',
        );
      } else if (formMode === 'edit' && editingJob) {
        const wasApproved = editingJob.status === 'APPROVED';
        const updated = await updateJob(editingJob.id, {
          ...basePayload,
          ...(editingJob.status === 'DRAFT' || editingJob.status === 'REJECTED'
            ? { status: form.initialStatus }
            : {}),
        });
        if (wasApproved && updated.status === 'PENDING') {
          setSuccessMsg(
            'Đã cập nhật tin tuyển dụng! Theo quy tắc BR-08, tin đã tự động chuyển về trạng thái Chờ duyệt (PENDING) để Admin thẩm định lại.',
          );
        } else {
          setSuccessMsg('Đã cập nhật thông tin tin tuyển dụng thành công!');
        }
      }

      setFormMode('closed');
      setEditingJob(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể lưu tin tuyển dụng');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSubmitForApproval = async (job: JobItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateJob(job.id, { status: 'PENDING' });
      setSuccessMsg(`Đã gửi tin "${job.title}" sang trạng thái Chờ duyệt (PENDING)!`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể gửi duyệt tin tuyển dụng');
    }
  };

  const handleConfirmActionExecute = async () => {
    if (!confirmAction) return;
    setProcessingAction(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (confirmAction.type === 'close') {
        await closeJob(confirmAction.job.id);
        setSuccessMsg(
          `Đã đóng tin tuyển dụng "${confirmAction.job.title}" (UC15 - Ngừng nhận hồ sơ).`,
        );
      } else {
        await deleteJob(confirmAction.job.id);
        setSuccessMsg(
          `Đã xóa mềm tin tuyển dụng "${confirmAction.job.title}" (BR-05 - Bảo toàn lịch sử ứng tuyển).`,
        );
      }
      setConfirmAction(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
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
        <div className="rms-page-header">
          <div>
            <h1 className="rms-page-title">Quản lý tin tuyển dụng (UC14 · UC15)</h1>
            <p className="rms-muted">
              {company
                ? `Doanh nghiệp: ${company.name} — Tạo mới, chỉnh sửa, đóng hoặc xóa mềm các tin tuyển dụng của công ty`
                : 'Quản lý toàn bộ các vị trí tuyển dụng thuộc doanh nghiệp của bạn'}
            </p>
          </div>

          {company && formMode === 'closed' && (
            <div className="rms-header-actions">
              <AppLink to="/recruiter/company" className="rms-btn rms-btn-outline">
                🏢 Hồ sơ công ty
              </AppLink>
              <button
                type="button"
                className="rms-btn rms-btn-primary"
                onClick={handleOpenCreateForm}
              >
                + Đăng tin tuyển dụng mới
              </button>
            </div>
          )}
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

        {candidateTodoJob && (
          <div className="rms-alert rms-alert-info" role="status">
            <div>
              {/* TODO: Điều hướng sang trang danh sách ứng viên (UC16 - Oanh) */}
              <strong>Thông báo tích hợp (UC16):</strong> Trang xem danh sách ứng viên nộp vào tin{' '}
              <strong>&ldquo;{candidateTodoJob.title}&rdquo;</strong> thuộc module{' '}
              <code>Applications</code> (do Oanh phụ trách) đang chờ tích hợp.
            </div>
            <button
              type="button"
              className="rms-btn rms-btn-outline rms-btn-sm"
              onClick={() => setCandidateTodoJob(null)}
            >
              Đã hiểu
            </button>
          </div>
        )}

        {!ownerId ? (
          <div className="rms-empty-state">
            <h2>Chưa chọn tài khoản Nhà tuyển dụng (Recruiter)</h2>
            <p>
              Hãy chọn một tài khoản Recruiter từ danh sách trên thanh <strong>DEV MODE</strong>{' '}
              phía trên để quản lý tin tuyển dụng.
            </p>
          </div>
        ) : checkingCompany ? (
          <div className="rms-loading-state">Đang kiểm tra thông tin công ty...</div>
        ) : !company ? (
          /* Cảnh báo BR-04: Chưa có thông tin công ty */
          <div className="rms-empty-state rms-br04-warning">
            <div className="rms-br04-badge">Quy tắc nghiệp vụ BR-04</div>
            <h2>Bạn cần tạo thông tin công ty trước khi đăng tin tuyển dụng</h2>
            <p>
              Tài khoản Recruiter hiện tại chưa thiết lập hồ sơ công ty. Theo quy định{' '}
              <strong>BR-04</strong>, nhà tuyển dụng bắt buộc phải có thông tin công ty hợp lệ trước
              khi tạo tin tuyển dụng mới.
            </p>
            <AppLink to="/recruiter/company" className="rms-btn rms-btn-primary rms-btn-lg">
              → Đi tới trang Tạo hồ sơ công ty (UC13)
            </AppLink>
          </div>
        ) : formMode !== 'closed' ? (
          /* Form Tạo mới / Chỉnh sửa tin tuyển dụng (UC14 & BR-08) */
          <div className="rms-card">
            <div className="rms-form-card-header">
              <h2 className="rms-section-title" style={{ marginBottom: 0, borderBottom: 'none' }}>
                {formMode === 'create'
                  ? 'Tạo tin tuyển dụng mới (UC14)'
                  : `Chỉnh sửa tin tuyển dụng: ${editingJob?.title}`}
              </h2>
              <button
                type="button"
                className="rms-btn rms-btn-outline rms-btn-sm"
                onClick={handleCloseForm}
              >
                ← Quay lại danh sách
              </button>
            </div>

            {formMode === 'edit' && editingJob?.status === 'APPROVED' && (
              <div className="rms-alert rms-alert-warning" role="note">
                <div>
                  <strong>⚠️ Lưu ý theo quy tắc BR-08:</strong> Tin tuyển dụng này đang ở trạng thái{' '}
                  <strong>Đã duyệt (APPROVED)</strong>. Nếu bạn chỉnh sửa các nội dung quan trọng
                  (tiêu đề, mô tả, yêu cầu, quyền lợi, địa điểm, kỹ năng, mức lương, hình thức, cấp
                  bậc), tin sẽ tự động chuyển về trạng thái <strong>Chờ duyệt (PENDING)</strong> để
                  Admin kiểm duyệt lại.
                </div>
              </div>
            )}

            {formMode === 'edit' &&
              editingJob?.status === 'REJECTED' &&
              editingJob.rejectReason && (
                <div className="rms-alert rms-alert-error" role="note">
                  <div>
                    <strong>Lý do bị từ chối lần trước:</strong> {editingJob.rejectReason}
                  </div>
                </div>
              )}

            <form className="rms-form" onSubmit={(e) => void handleFormSubmit(e)}>
              <div className="rms-form-grid">
                <div className="rms-field rms-field-full">
                  <label htmlFor="job-title" className="rms-label">
                    Tiêu đề vị trí tuyển dụng <span className="rms-required">*</span>
                  </label>
                  <input
                    id="job-title"
                    type="text"
                    required
                    minLength={3}
                    maxLength={200}
                    className="rms-input"
                    placeholder="VD: Senior Backend Engineer (NodeJS / NestJS)"
                    value={form.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                  />
                </div>

                <div className="rms-field">
                  <label htmlFor="job-location" className="rms-label">
                    Địa điểm làm việc <span className="rms-required">*</span>
                  </label>
                  <select
                    id="job-location"
                    className="rms-select"
                    value={form.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rms-field">
                  <label htmlFor="job-type" className="rms-label">
                    Hình thức làm việc <span className="rms-required">*</span>
                  </label>
                  <select
                    id="job-type"
                    className="rms-select"
                    value={form.jobType}
                    onChange={(e) => handleFieldChange('jobType', e.target.value as JobType)}
                  >
                    {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((typeKey) => (
                      <option key={typeKey} value={typeKey}>
                        {JOB_TYPE_LABELS[typeKey]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rms-field">
                  <label htmlFor="job-level" className="rms-label">
                    Cấp bậc <span className="rms-required">*</span>
                  </label>
                  <select
                    id="job-level"
                    className="rms-select"
                    value={form.level}
                    onChange={(e) => handleFieldChange('level', e.target.value as JobLevel)}
                  >
                    {(Object.keys(JOB_LEVEL_LABELS) as JobLevel[]).map((levelKey) => (
                      <option key={levelKey} value={levelKey}>
                        {JOB_LEVEL_LABELS[levelKey]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rms-field">
                  <label htmlFor="job-deadline" className="rms-label">
                    Hạn nộp hồ sơ (để trống = không giới hạn)
                  </label>
                  <input
                    id="job-deadline"
                    type="date"
                    className="rms-input"
                    value={form.deadline}
                    onChange={(e) => handleFieldChange('deadline', e.target.value)}
                  />
                </div>

                <div className="rms-field">
                  <label htmlFor="job-salary-min" className="rms-label">
                    Mức lương tối thiểu (VNĐ/tháng)
                  </label>
                  <input
                    id="job-salary-min"
                    type="number"
                    min={0}
                    step={500000}
                    className="rms-input"
                    placeholder="Để trống = Thỏa thuận (VD: 15000000)"
                    value={form.salaryMin}
                    onChange={(e) => handleFieldChange('salaryMin', e.target.value)}
                  />
                </div>

                <div className="rms-field">
                  <label htmlFor="job-salary-max" className="rms-label">
                    Mức lương tối đa (VNĐ/tháng)
                  </label>
                  <input
                    id="job-salary-max"
                    type="number"
                    min={0}
                    step={500000}
                    className="rms-input"
                    placeholder="Để trống = Thỏa thuận (VD: 30000000)"
                    value={form.salaryMax}
                    onChange={(e) => handleFieldChange('salaryMax', e.target.value)}
                  />
                </div>

                <div className="rms-field rms-field-full">
                  <label htmlFor="job-skills" className="rms-label">
                    Kỹ năng yêu cầu (cách nhau bởi dấu phẩy) <span className="rms-required">*</span>
                  </label>
                  <input
                    id="job-skills"
                    type="text"
                    required
                    className="rms-input"
                    placeholder="VD: NodeJS, NestJS, PostgreSQL, Docker"
                    value={form.skillsText}
                    onChange={(e) => handleFieldChange('skillsText', e.target.value)}
                  />
                  <div className="rms-popular-skills" style={{ marginTop: 8, paddingTop: 8 }}>
                    <span className="rms-popular-label">Chọn nhanh kỹ năng:</span>
                    {SUGGESTED_SKILLS.map((sk) => {
                      const active = form.skillsText
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .includes(sk.toLowerCase());
                      return (
                        <button
                          key={sk}
                          type="button"
                          className={`rms-skill-chip ${active ? 'active' : ''}`}
                          onClick={() => handleToggleSuggestedSkill(sk)}
                        >
                          + {sk}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rms-field rms-field-full">
                  <label htmlFor="job-description" className="rms-label">
                    Mô tả chi tiết công việc <span className="rms-required">*</span>
                  </label>
                  <textarea
                    id="job-description"
                    rows={5}
                    required
                    minLength={10}
                    className="rms-textarea"
                    placeholder="Mô tả trách nhiệm, công việc hàng ngày, dự án tham gia..."
                    value={form.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                  />
                </div>

                <div className="rms-field rms-field-full">
                  <label htmlFor="job-requirements" className="rms-label">
                    Yêu cầu ứng viên
                  </label>
                  <textarea
                    id="job-requirements"
                    rows={4}
                    className="rms-textarea"
                    placeholder="Kinh nghiệm, kỹ năng chuyên môn, bằng cấp, kỹ năng mềm..."
                    value={form.requirements}
                    onChange={(e) => handleFieldChange('requirements', e.target.value)}
                  />
                </div>

                <div className="rms-field rms-field-full">
                  <label htmlFor="job-benefits" className="rms-label">
                    Quyền lợi được hưởng
                  </label>
                  <textarea
                    id="job-benefits"
                    rows={4}
                    className="rms-textarea"
                    placeholder="Thưởng lương tháng 13, bảo hiểm sức khỏe, lộ trình xét tăng lương..."
                    value={form.benefits}
                    onChange={(e) => handleFieldChange('benefits', e.target.value)}
                  />
                </div>

                {(formMode === 'create' ||
                  editingJob?.status === 'DRAFT' ||
                  editingJob?.status === 'REJECTED') && (
                  <div className="rms-field rms-field-full">
                    <label htmlFor="job-initial-status" className="rms-label">
                      Trạng thái sau khi lưu
                    </label>
                    <select
                      id="job-initial-status"
                      className="rms-select"
                      value={form.initialStatus}
                      onChange={(e) =>
                        handleFieldChange('initialStatus', e.target.value as 'DRAFT' | 'PENDING')
                      }
                    >
                      <option value="PENDING">📤 Gửi chờ Admin duyệt ngay (PENDING)</option>
                      <option value="DRAFT">📝 Lưu làm bản nháp (DRAFT - chưa gửi duyệt)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="rms-form-actions">
                <button
                  type="button"
                  className="rms-btn rms-btn-outline"
                  disabled={saving}
                  onClick={handleCloseForm}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="rms-btn rms-btn-primary" disabled={saving}>
                  {saving
                    ? 'Đang lưu...'
                    : formMode === 'create'
                      ? 'Lưu tin tuyển dụng'
                      : 'Cập nhật tin tuyển dụng'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Danh sách tin tuyển dụng của công ty */
          <>
            <form className="rms-filter-bar" onSubmit={handleFilterSubmit}>
              <div className="rms-filter-bar-left">
                <input
                  type="text"
                  className="rms-input rms-filter-search-input"
                  placeholder="Tìm kiếm theo tiêu đề tin tuyển dụng..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="rms-select rms-filter-status-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as JobStatus | '');
                    setPage(1);
                  }}
                  aria-label="Lọc theo trạng thái tin"
                >
                  <option value="">Tất cả trạng thái</option>
                  {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {JOB_STATUS_LABELS[st]} ({st})
                    </option>
                  ))}
                </select>
                <button type="submit" className="rms-btn rms-btn-primary">
                  Lọc
                </button>
                {(statusFilter || appliedKeyword) && (
                  <button
                    type="button"
                    className="rms-btn rms-btn-outline"
                    onClick={() => {
                      setStatusFilter('');
                      setKeyword('');
                      setAppliedKeyword('');
                      setPage(1);
                    }}
                  >
                    Đặt lại
                  </button>
                )}
              </div>

              <div className="rms-results-summary">
                Tổng cộng: <strong>{meta.total}</strong> tin tuyển dụng
              </div>
            </form>

            {loadingJobs ? (
              <div className="rms-loading-state">Đang tải danh sách tin tuyển dụng...</div>
            ) : jobs.length === 0 ? (
              <div className="rms-empty-state">
                <h3>Chưa có tin tuyển dụng nào</h3>
                <p>
                  Bắt đầu đăng tin tuyển dụng đầu tiên cho doanh nghiệp{' '}
                  <strong>{company.name}</strong> để tiếp cận ứng viên.
                </p>
                <button
                  type="button"
                  className="rms-btn rms-btn-primary"
                  onClick={handleOpenCreateForm}
                >
                  + Đăng tin tuyển dụng đầu tiên
                </button>
              </div>
            ) : (
              <>
                <div className="rms-job-list">
                  {jobs.map((job) => (
                    <article key={job.id} className="rms-job-card">
                      <div className="rms-job-card-body">
                        <div className="rms-job-card-header">
                          <div>
                            <div className="rms-job-title-row">
                              <h2 className="rms-job-card-title">
                                {job.status === 'APPROVED' ? (
                                  <AppLink to={`/jobs/${job.id}`}>{job.title}</AppLink>
                                ) : (
                                  <span>{job.title}</span>
                                )}
                              </h2>
                              <span className={getStatusBadgeClass(job.status)}>
                                {JOB_STATUS_LABELS[job.status]}
                              </span>
                            </div>
                          </div>

                          <div className="rms-job-card-salary">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </div>
                        </div>

                        {job.status === 'REJECTED' && job.rejectReason && (
                          <div className="rms-reject-reason-box">
                            <strong>Lý do Admin từ chối (UC23):</strong> {job.rejectReason}
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
                            🕒 Tạo ngày: {formatDate(job.createdAt)}
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
                            {/* TODO: Điều hướng sang trang danh sách ứng viên (UC16 - Oanh) */}
                            <button
                              type="button"
                              className="rms-btn rms-btn-outline rms-btn-sm"
                              onClick={() => setCandidateTodoJob(job)}
                            >
                              👥 Xem ứng viên
                            </button>

                            {(job.status === 'DRAFT' || job.status === 'REJECTED') && (
                              <button
                                type="button"
                                className="rms-btn rms-btn-primary rms-btn-sm"
                                onClick={() => void handleQuickSubmitForApproval(job)}
                              >
                                📤 Gửi duyệt
                              </button>
                            )}

                            <button
                              type="button"
                              className="rms-btn rms-btn-outline rms-btn-sm"
                              onClick={() => handleOpenEditForm(job)}
                            >
                              ✏️ Sửa
                            </button>

                            {job.status !== 'CLOSED' && (
                              <button
                                type="button"
                                className="rms-btn rms-btn-outline rms-btn-sm"
                                onClick={() => setConfirmAction({ type: 'close', job })}
                              >
                                🔒 Đóng tin
                              </button>
                            )}

                            <button
                              type="button"
                              className="rms-btn rms-btn-danger-outline rms-btn-sm"
                              onClick={() => setConfirmAction({ type: 'delete', job })}
                            >
                              🗑 Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <Pagination meta={meta} onPageChange={(nextPage) => setPage(nextPage)} />
              </>
            )}
          </>
        )}
      </div>

      {/* Modal xác nhận Đóng tin (UC15) hoặc Xóa mềm tin (BR-05) */}
      {confirmAction && (
        <div className="rms-modal-backdrop" role="dialog" aria-modal="true">
          <div className="rms-modal">
            <h3 className="rms-modal-title">
              {confirmAction.type === 'close'
                ? 'Xác nhận đóng tin tuyển dụng (UC15)'
                : 'Xác nhận xóa mềm tin tuyển dụng (BR-05)'}
            </h3>
            <p className="rms-modal-body">
              {confirmAction.type === 'close' ? (
                <>
                  Bạn có chắc chắn muốn đóng tin{' '}
                  <strong>&ldquo;{confirmAction.job.title}&rdquo;</strong>? Tin sau khi đóng sẽ
                  chuyển sang trạng thái <code>CLOSED</code> và ngừng nhận hồ sơ ứng tuyển mới.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa tin{' '}
                  <strong>&ldquo;{confirmAction.job.title}&rdquo;</strong>? Theo quy tắc{' '}
                  <strong>BR-05</strong>, hệ thống sẽ thực hiện <strong>xóa mềm</strong> (
                  <code>deletedAt</code>) để bảo toàn lịch sử đơn ứng tuyển liên quan.
                </>
              )}
            </p>
            <div className="rms-modal-actions">
              <button
                type="button"
                className="rms-btn rms-btn-outline"
                disabled={processingAction}
                onClick={() => setConfirmAction(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`rms-btn ${
                  confirmAction.type === 'delete' ? 'rms-btn-danger' : 'rms-btn-primary'
                }`}
                disabled={processingAction}
                onClick={() => void handleConfirmActionExecute()}
              >
                {processingAction
                  ? 'Đang xử lý...'
                  : confirmAction.type === 'close'
                    ? 'Đồng ý đóng tin'
                    : 'Đồng ý xóa mềm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
