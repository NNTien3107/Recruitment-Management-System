import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCompanyById } from '../api/companies.api';
import { AppLink } from '../components/Router';
import type { CompanyDetail } from '../types/models';
import { formatDate, formatSalary, JOB_LEVEL_LABELS, JOB_TYPE_LABELS } from '../utils/formatters';

interface CompanyDetailPageProps {
  companyId?: string;
}

export function CompanyDetailPage({ companyId: propCompanyId }: CompanyDetailPageProps) {
  const params = useParams<{ id: string }>();
  const companyId = propCompanyId ?? params.id ?? '';
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCompanyById(companyId);
        if (!cancelled) setCompany(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tìm thấy thông tin công ty');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCompany();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="rms-container rms-page-section">
        <div className="rms-loading-state">Đang tải thông tin công ty...</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="rms-container rms-page-section">
        <div className="rms-empty-state">
          <h2>Không tìm thấy thông tin công ty</h2>
          <p>{error || 'Doanh nghiệp không tồn tại trên hệ thống.'}</p>
          <AppLink to="/jobs" className="rms-btn rms-btn-primary">
            ← Quay lại danh sách việc làm
          </AppLink>
        </div>
      </div>
    );
  }

  const jobs = company.jobs ?? [];

  return (
    <div className="rms-container rms-page-section">
      <div className="rms-breadcrumb">
        <AppLink to="/jobs">← Danh sách việc làm</AppLink>
        <span>/</span>
        <span>{company.name}</span>
      </div>

      {/* Company Header */}
      <section className="rms-detail-header-card">
        <div className="rms-detail-header-main">
          <div className="rms-job-card-logo rms-logo-lg">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} />
            ) : (
              <div className="rms-logo-fallback">{company.name.charAt(0).toUpperCase()}</div>
            )}
          </div>

          <div className="rms-detail-title-group">
            <h1 className="rms-detail-title">{company.name}</h1>

            <div className="rms-detail-badges">
              {company.industry && (
                <span className="rms-badge rms-badge-info">🏢 {company.industry}</span>
              )}
              {company.size && (
                <span className="rms-badge rms-badge-purple">👥 Quy mô: {company.size}</span>
              )}
              {company.address && (
                <span className="rms-badge rms-badge-neutral">📍 {company.address}</span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rms-badge rms-badge-link"
                >
                  🌐 {company.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="rms-detail-grid">
        <div className="rms-detail-main">
          <section className="rms-card">
            <h2 className="rms-section-title">Giới thiệu công ty</h2>
            <div className="rms-prose">
              {company.description || 'Công ty chưa cập nhật mô tả giới thiệu chi tiết.'}
            </div>
          </section>

          <section className="rms-card">
            <h2 className="rms-section-title">Vị trí đang tuyển dụng ({jobs.length})</h2>

            {jobs.length === 0 ? (
              <p className="rms-muted">Hiện tại công ty chưa có tin tuyển dụng nào đang mở.</p>
            ) : (
              <div className="rms-job-list">
                {jobs.map((job) => (
                  <article key={job.id} className="rms-job-card rms-job-card-compact">
                    <div className="rms-job-card-body">
                      <div className="rms-job-card-header">
                        <h3 className="rms-job-card-title">
                          <AppLink to={`/jobs/${job.id}`}>{job.title}</AppLink>
                        </h3>
                        <div className="rms-job-card-salary">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                      </div>

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
                      </div>

                      <div className="rms-job-card-footer">
                        <div className="rms-job-skills">
                          {job.skills.map((skill) => (
                            <span key={skill} className="rms-skill-tag rms-skill-tag-static">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <AppLink
                          to={`/jobs/${job.id}`}
                          className="rms-btn rms-btn-outline rms-btn-sm"
                        >
                          Xem chi tiết →
                        </AppLink>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="rms-detail-sidebar">
          <div className="rms-card">
            <h2 className="rms-section-title">Thông tin liên hệ</h2>
            <dl className="rms-info-list">
              <div className="rms-info-item">
                <dt>Tên doanh nghiệp:</dt>
                <dd>{company.name}</dd>
              </div>
              {company.industry && (
                <div className="rms-info-item">
                  <dt>Lĩnh vực:</dt>
                  <dd>{company.industry}</dd>
                </div>
              )}
              {company.size && (
                <div className="rms-info-item">
                  <dt>Quy mô:</dt>
                  <dd>{company.size} nhân sự</dd>
                </div>
              )}
              {company.address && (
                <div className="rms-info-item">
                  <dt>Trụ sở:</dt>
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
          </div>
        </aside>
      </div>
    </div>
  );
}
