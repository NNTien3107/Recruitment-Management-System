import { useEffect, useState, type FormEvent } from 'react';
import { fetchPublicJobs } from '../api/jobs.api';
import { Pagination } from '../components/Pagination';
import { AppLink } from '../components/Router';
import type {
  JobItem,
  JobLevel,
  JobSort,
  JobType,
  PaginationMeta,
  QueryJobsParams,
} from '../types/models';
import {
  formatDate,
  formatSalary,
  JOB_LEVEL_LABELS,
  JOB_SORT_LABELS,
  JOB_TYPE_LABELS,
  LOCATION_OPTIONS,
} from '../utils/formatters';

const POPULAR_SKILLS = ['NodeJS', 'NestJS', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'];

export function JobsSearchPage() {
  // Trạng thái form lọc
  const [keyword, setKeyword] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<JobType | ''>('');
  const [level, setLevel] = useState<JobLevel | ''>('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [sort, setSort] = useState<JobSort>('newest');
  const [pageSize, setPageSize] = useState<number>(10);

  // Bộ lọc đang áp dụng
  const [appliedFilters, setAppliedFilters] = useState<QueryJobsParams>({
    page: 1,
    pageSize: 10,
    sort: 'newest',
  });
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Dữ liệu trả về từ API
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchPublicJobs(appliedFilters);
        if (!cancelled) {
          setJobs(response.data);
          setMeta(response.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không thể tải danh sách việc làm');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchJobs();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, reloadKey]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const minVal = salaryMin.trim() !== '' ? Number(salaryMin) : '';
    const maxVal = salaryMax.trim() !== '' ? Number(salaryMax) : '';

    if (minVal !== '' && maxVal !== '' && minVal > maxVal) {
      setError('Mức lương tối thiểu không được lớn hơn mức lương tối đa');
      return;
    }

    setAppliedFilters({
      page: 1,
      pageSize,
      keyword: keyword.trim() || undefined,
      skills: skills.trim() || undefined,
      location: location.trim() || undefined,
      jobType: jobType || undefined,
      level: level || undefined,
      salaryMin: minVal,
      salaryMax: maxVal,
      sort,
    });
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSkills('');
    setLocation('');
    setJobType('');
    setLevel('');
    setSalaryMin('');
    setSalaryMax('');
    setSort('newest');
    setPageSize(10);
    setAppliedFilters({
      page: 1,
      pageSize: 10,
      sort: 'newest',
    });
  };

  const handleSkillTagClick = (skillName: string) => {
    const currentList = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = currentList.some((s) => s.toLowerCase() === skillName.toLowerCase());
    const nextList = exists
      ? currentList.filter((s) => s.toLowerCase() !== skillName.toLowerCase())
      : [...currentList, skillName];
    const nextSkills = nextList.join(', ');
    setSkills(nextSkills);
    setAppliedFilters((prev) => ({
      ...prev,
      page: 1,
      skills: nextSkills || undefined,
    }));
  };

  const handleSortChange = (nextSort: JobSort) => {
    setSort(nextSort);
    setAppliedFilters((prev) => ({
      ...prev,
      page: 1,
      sort: nextSort,
    }));
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setAppliedFilters((prev) => ({
      ...prev,
      page: 1,
      pageSize: nextSize,
    }));
  };

  const handlePageChange = (nextPage: number) => {
    setAppliedFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="rms-page">
      {/* Hero & Search Banner */}
      <section className="rms-hero-banner">
        <div className="rms-container">
          <h1 className="rms-hero-title">Tìm kiếm cơ hội nghề nghiệp phù hợp với bạn</h1>
          <p className="rms-hero-subtitle">
            Khám phá hàng nghìn tin tuyển dụng đã được kiểm duyệt từ các doanh nghiệp uy tín
          </p>

          <form className="rms-search-card" onSubmit={handleSearchSubmit}>
            <div className="rms-search-grid-top">
              <div className="rms-field">
                <label htmlFor="filter-keyword" className="rms-label">
                  Từ khóa công việc
                </label>
                <input
                  id="filter-keyword"
                  type="text"
                  className="rms-input"
                  placeholder="Tiêu đề, vị trí hoặc mô tả công việc..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="rms-field">
                <label htmlFor="filter-skills" className="rms-label">
                  Kỹ năng (cách nhau bởi dấu phẩy)
                </label>
                <input
                  id="filter-skills"
                  type="text"
                  className="rms-input"
                  placeholder="VD: NodeJS, NestJS, React..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div className="rms-field">
                <label htmlFor="filter-location" className="rms-label">
                  Địa điểm
                </label>
                <select
                  id="filter-location"
                  className="rms-select"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">Tất cả địa điểm</option>
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rms-search-grid-bottom">
              <div className="rms-field">
                <label htmlFor="filter-jobType" className="rms-label">
                  Hình thức làm việc
                </label>
                <select
                  id="filter-jobType"
                  className="rms-select"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType | '')}
                >
                  <option value="">Tất cả hình thức</option>
                  {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {JOB_TYPE_LABELS[typeKey]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rms-field">
                <label htmlFor="filter-level" className="rms-label">
                  Cấp bậc
                </label>
                <select
                  id="filter-level"
                  className="rms-select"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as JobLevel | '')}
                >
                  <option value="">Tất cả cấp bậc</option>
                  {(Object.keys(JOB_LEVEL_LABELS) as JobLevel[]).map((levelKey) => (
                    <option key={levelKey} value={levelKey}>
                      {JOB_LEVEL_LABELS[levelKey]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rms-field">
                <label htmlFor="filter-salaryMin" className="rms-label">
                  Lương tối thiểu (VNĐ)
                </label>
                <input
                  id="filter-salaryMin"
                  type="number"
                  min={0}
                  step={1000000}
                  className="rms-input"
                  placeholder="VD: 10000000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
              </div>

              <div className="rms-field">
                <label htmlFor="filter-salaryMax" className="rms-label">
                  Lương tối đa (VNĐ)
                </label>
                <input
                  id="filter-salaryMax"
                  type="number"
                  min={0}
                  step={1000000}
                  className="rms-input"
                  placeholder="VD: 35000000"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
              </div>

              <div className="rms-search-actions">
                <button type="submit" className="rms-btn rms-btn-primary">
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  className="rms-btn rms-btn-outline"
                  onClick={handleResetFilters}
                >
                  Xóa lọc
                </button>
              </div>
            </div>

            {/* Gợi ý kỹ năng phổ biến */}
            <div className="rms-popular-skills">
              <span className="rms-popular-label">Kỹ năng phổ biến:</span>
              {POPULAR_SKILLS.map((sk) => {
                const isActive = skills
                  .split(',')
                  .map((s) => s.trim().toLowerCase())
                  .includes(sk.toLowerCase());
                return (
                  <button
                    key={sk}
                    type="button"
                    className={`rms-skill-chip ${isActive ? 'active' : ''}`}
                    onClick={() => handleSkillTagClick(sk)}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          </form>
        </div>
      </section>

      {/* Kết quả tìm kiếm */}
      <section className="rms-container rms-results-section">
        <div className="rms-results-toolbar">
          <div className="rms-results-summary">
            Tìm thấy <strong>{meta.total.toLocaleString('vi-VN')}</strong> việc làm đang mở
          </div>

          <div className="rms-results-controls">
            <label className="rms-inline-control">
              <span>Sắp xếp:</span>
              <select
                className="rms-select rms-select-sm"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as JobSort)}
              >
                {(Object.keys(JOB_SORT_LABELS) as JobSort[]).map((sortKey) => (
                  <option key={sortKey} value={sortKey}>
                    {JOB_SORT_LABELS[sortKey]}
                  </option>
                ))}
              </select>
            </label>

            <label className="rms-inline-control">
              <span>Hiển thị:</span>
              <select
                className="rms-select rms-select-sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10 tin / trang</option>
                <option value={20}>20 tin / trang</option>
                <option value={50}>50 tin / trang</option>
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div className="rms-alert rms-alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="rms-btn rms-btn-outline rms-btn-sm"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Thử lại
            </button>
          </div>
        )}

        {loading ? (
          <div className="rms-loading-state">Đang tải danh sách việc làm...</div>
        ) : jobs.length === 0 ? (
          <div className="rms-empty-state">
            <h3>Không tìm thấy việc làm phù hợp</h3>
            <p>Hãy thử điều chỉnh từ khóa hoặc xóa bớt các bộ lọc để xem nhiều kết quả hơn.</p>
            <button type="button" className="rms-btn rms-btn-primary" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </button>
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
                        <h2 className="rms-job-card-title">
                          <AppLink to={`/jobs/${job.id}`}>{job.title}</AppLink>
                        </h2>
                        {job.company && (
                          <AppLink
                            to={`/companies/${job.company.id}`}
                            className="rms-job-card-company"
                          >
                            {job.company.name}
                          </AppLink>
                        )}
                      </div>
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
                          <button
                            key={skill}
                            type="button"
                            className="rms-skill-tag"
                            onClick={() => handleSkillTagClick(skill)}
                            title={`Lọc theo kỹ năng ${skill}`}
                          >
                            {skill}
                          </button>
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

            <Pagination meta={meta} onPageChange={handlePageChange} />
          </>
        )}
      </section>
    </div>
  );
}
