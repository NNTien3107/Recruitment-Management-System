import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchJobById } from '../api/jobs.api';
import { AppLink } from '../components/Router';
import type { JobItem } from '../types/models';
import { formatDate, formatSalary, JOB_LEVEL_LABELS, JOB_TYPE_LABELS } from '../utils/formatters';

interface JobDetailPageProps {
  jobId?: string;
}

export function JobDetailPage({ jobId: propJobId }: JobDetailPageProps) {
  const params = useParams<{ id: string }>();
  const jobId = propJobId ?? params.id ?? '';
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applyNoticeVisible, setApplyNoticeVisible] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const loadJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJobById(jobId);
        if (!cancelled) setJob(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tìm thấy tin tuyển dụng');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadJob();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handleApplyClick = () => {
    // TODO: Kết nối modal ứng tuyển (UC09 - Oanh)
    setApplyNoticeVisible(true);
  };

  if (loading) {
    return (
      <div className="rms-container rms-page-section">
        <div className="rms-loading-state">Đang tải thông tin chi tiết việc làm...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rms-container rms-page-section">
        <div className="rms-empty-state">
          <h2>Không thể hiển thị tin tuyển dụng</h2>
          <p>{error || 'Tin tuyển dụng không tồn tại hoặc đã ngừng nhận hồ sơ.'}</p>
          <AppLink to="/jobs" className="rms-btn rms-btn-primary">
            ← Quay lại danh sách việc làm
          </AppLink>
        </div>
      </div>
    );
  }

  const company = job.company;

  return (
    <div className="rms-container rms-page-section">
      <div className="rms-breadcrumb">
        <AppLink to="/jobs">← Danh sách việc làm</AppLink>
        <span>/</span>
        <span>{job.title}</span>
      </div>

      {/* Header card */}
      <section className="rms-detail-header-card">
        <div className="rms-detail-header-main">
          <div className="rms-job-card-logo rms-logo-lg">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} />
            ) : (
              <div className="rms-logo-fallback">
                {(company?.name || 'C').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="rms-detail-title-group">
            <h1 className="rms-detail-title">{job.title}</h1>
            {company && (
              <AppLink to={`/companies/${company.id}`} className="rms-detail-company-link">
                {company.name}
              </AppLink>
            )}

            <div className="rms-detail-badges">
              <span className="rms-badge rms-badge-salary">
                💰 {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
              <span className="rms-badge rms-badge-neutral">📍 {job.location}</span>
              <span className="rms-badge rms-badge-info">💼 {JOB_TYPE_LABELS[job.jobType]}</span>
              <span className="rms-badge rms-badge-purple">🎯 {JOB_LEVEL_LABELS[job.level]}</span>
              <span className="rms-badge rms-badge-neutral">
                ⏳ Hạn nộp: {formatDate(job.deadline)}
              </span>
            </div>
          </div>
        </div>

        <div className="rms-detail-cta">
          {/* TODO: Kết nối modal ứng tuyển (UC09 - Oanh) */}
          <button
            type="button"
            className="rms-btn rms-btn-primary rms-btn-lg"
            onClick={handleApplyClick}
          >
            Ứng tuyển ngay
          </button>
          <span className="rms-detail-posted-date">
            Đăng ngày: {formatDate(job.approvedAt || job.createdAt)}
          </span>
        </div>
      </section>

      {applyNoticeVisible && (
        <div className="rms-alert rms-alert-info" role="status">
          <div>
            <strong>Thông báo tích hợp (UC09):</strong> Tính năng nộp CV ứng tuyển thuộc module{' '}
            <code>Candidate &amp; Applications</code> (Oanh phụ trách) đang chờ tích hợp.
          </div>
          <button
            type="button"
            className="rms-btn rms-btn-outline rms-btn-sm"
            onClick={() => setApplyNoticeVisible(false)}
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Nội dung chi tiết 2 cột */}
      <div className="rms-detail-grid">
        <div className="rms-detail-main">
          <section className="rms-card">
            <h2 className="rms-section-title">Mô tả công việc</h2>
            <div className="rms-prose">{job.description}</div>
          </section>

          {job.requirements && (
            <section className="rms-card">
              <h2 className="rms-section-title">Yêu cầu ứng viên</h2>
              <div className="rms-prose">{job.requirements}</div>
            </section>
          )}

          {job.benefits && (
            <section className="rms-card">
              <h2 className="rms-section-title">Quyền lợi được hưởng</h2>
              <div className="rms-prose">{job.benefits}</div>
            </section>
          )}

          <section className="rms-card">
            <h2 className="rms-section-title">Kỹ năng chuyên môn</h2>
            <div className="rms-job-skills">
              {job.skills.length > 0 ? (
                job.skills.map((skill) => (
                  <span key={skill} className="rms-skill-tag rms-skill-tag-static">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="rms-muted">Không yêu cầu kỹ năng cụ thể</span>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar thông tin công ty */}
        <aside className="rms-detail-sidebar">
          {company && (
            <div className="rms-card">
              <h2 className="rms-section-title">Thông tin công ty</h2>
              <div className="rms-company-mini-header">
                <div className="rms-job-card-logo">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} />
                  ) : (
                    <div className="rms-logo-fallback">{company.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div>
                  <h3 className="rms-company-mini-name">
                    <AppLink to={`/companies/${company.id}`}>{company.name}</AppLink>
                  </h3>
                  {company.industry && <p className="rms-muted">{company.industry}</p>}
                </div>
              </div>

              <dl className="rms-info-list">
                {company.size && (
                  <div className="rms-info-item">
                    <dt>Quy mô:</dt>
                    <dd>{company.size} nhân sự</dd>
                  </div>
                )}
                {company.address && (
                  <div className="rms-info-item">
                    <dt>Địa chỉ:</dt>
                    <dd>{company.address}</dd>
                  </div>
                )}
                {company.website && (
                  <div className="rms-info-item">
                    <dt>Website:</dt>
                    <dd>
                      <a href={company.website} target="_blank" rel="noreferrer">
                        {company.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              <AppLink
                to={`/companies/${company.id}`}
                className="rms-btn rms-btn-outline rms-btn-block"
              >
                Xem trang công ty →
              </AppLink>
            </div>
          )}

          <div className="rms-card">
            <h2 className="rms-section-title">Tóm tắt công việc</h2>
            <dl className="rms-info-list">
              <div className="rms-info-item">
                <dt>Cấp bậc:</dt>
                <dd>{JOB_LEVEL_LABELS[job.level]}</dd>
              </div>
              <div className="rms-info-item">
                <dt>Hình thức:</dt>
                <dd>{JOB_TYPE_LABELS[job.jobType]}</dd>
              </div>
              <div className="rms-info-item">
                <dt>Địa điểm:</dt>
                <dd>{job.location}</dd>
              </div>
              <div className="rms-info-item">
                <dt>Mức lương:</dt>
                <dd>{formatSalary(job.salaryMin, job.salaryMax)}</dd>
              </div>
              <div className="rms-info-item">
                <dt>Hạn nộp hồ sơ:</dt>
                <dd>{formatDate(job.deadline)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
