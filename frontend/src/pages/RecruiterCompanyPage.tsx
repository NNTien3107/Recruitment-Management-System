import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  createCompany,
  fetchMyCompany,
  updateCompany,
  type CreateCompanyPayload,
} from '../api/companies.api';
import { AppLink } from '../components/Router';
import { useAuth } from '../features/auth/auth-context';
import type { CompanyDetail } from '../types/models';
import { formatDate } from '../utils/formatters';
import { getStoredRecruiterId } from '../utils/recruiter-context';

const COMPANY_SIZE_OPTIONS = [
  '1-50 nhân viên',
  '50-100 nhân viên',
  '100-500 nhân viên',
  '500-1000 nhân viên',
  '1000+ nhân viên',
] as const;

const INDUSTRY_SUGGESTIONS = [
  'Công nghệ thông tin',
  'Thương mại điện tử',
  'Fintech & Ngân hàng',
  'Viễn thông',
  'Trí tuệ nhân tạo (AI & Data)',
  'Outsourcing & Tư vấn CNTT',
  'Giáo dục (EdTech)',
] as const;

interface CompanyFormState {
  name: string;
  industry: string;
  size: string;
  address: string;
  website: string;
  logoUrl: string;
  description: string;
}

const EMPTY_FORM: CompanyFormState = {
  name: '',
  industry: '',
  size: '',
  address: '',
  website: '',
  logoUrl: '',
  description: '',
};

function companyToFormState(company: CompanyDetail): CompanyFormState {
  return {
    name: company.name || '',
    industry: company.industry || '',
    size: company.size || '',
    address: company.address || '',
    website: company.website || '',
    logoUrl: company.logoUrl || '',
    description: company.description || '',
  };
}

export function RecruiterCompanyPage() {
  const { user } = useAuth();
  const ownerId = user?.id ?? getStoredRecruiterId();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadTodoNotice, setUploadTodoNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) {
      return;
    }

    let cancelled = false;
    const loadMyCompany = async () => {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        const result = await fetchMyCompany();
        if (!cancelled) {
          setCompany(result);
          if (result) {
            setForm(companyToFormState(result));
            setIsEditing(false);
          } else {
            setForm(EMPTY_FORM);
            setIsEditing(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCompany(null);
          setErrorMsg(
            err instanceof Error ? err.message : 'Không thể tải thông tin công ty của bạn',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMyCompany();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const handleFieldChange = (field: keyof CompanyFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: Kết nối API upload file StorageService của Oanh
    setUploadTodoNotice(
      `Đã chọn file "${file.name}" (${Math.round(file.size / 1024)} KB). API upload file qua StorageService (do Oanh phụ trách) đang chờ tích hợp — tạm thời bạn có thể nhập trực tiếp đường dẫn ảnh vào ô URL Logo bên trên.`,
    );
  };

  const handleStartEdit = () => {
    if (company) {
      setForm(companyToFormState(company));
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (company) {
      setForm(companyToFormState(company));
      setIsEditing(false);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!ownerId) {
      setErrorMsg(
        'Vui lòng chọn hoặc nhập ownerId của tài khoản Recruiter ở thanh công cụ phía trên.',
      );
      return;
    }

    const trimmedName = form.name.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Tên công ty phải có ít nhất 2 ký tự.');
      return;
    }

    const payloadBase: Omit<CreateCompanyPayload, 'ownerId'> = {
      name: trimmedName,
      industry: form.industry.trim() || undefined,
      size: form.size.trim() || undefined,
      address: form.address.trim() || undefined,
      website: form.website.trim() || undefined,
      logoUrl: form.logoUrl.trim() || undefined,
      description: form.description.trim() || undefined,
    };

    setSaving(true);
    try {
      if (!company) {
        // UC13.2 - Tạo hồ sơ công ty mới (POST /api/companies)
        const created = await createCompany({
          ownerId,
          ...payloadBase,
        });
        setCompany(created);
        setForm(companyToFormState(created));
        setIsEditing(false);
        setSuccessMsg(
          'Tạo hồ sơ công ty mới thành công! Bây giờ bạn đã đủ điều kiện đăng tin tuyển dụng (BR-04).',
        );
      } else {
        // UC13.3 - Cập nhật thông tin công ty (PATCH /api/companies/:id)
        const updated = await updateCompany(company.id, payloadBase);
        setCompany(updated);
        setForm(companyToFormState(updated));
        setIsEditing(false);
        setSuccessMsg('Cập nhật thông tin công ty thành công!');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lưu thông tin công ty thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rms-page">
      <div className="rms-container rms-page-section">
        <div className="rms-page-header">
          <div>
            <h1 className="rms-page-title">Quản lý thông tin công ty (UC13)</h1>
            <p className="rms-muted">
              Thiết lập và cập nhật hồ sơ doanh nghiệp đại diện cho tài khoản Nhà tuyển dụng (Quan
              hệ 1-1)
            </p>
          </div>

          {company && !isEditing && (
            <div className="rms-header-actions">
              <AppLink to={`/companies/${company.id}`} className="rms-btn rms-btn-outline">
                👁 Xem trang công khai
              </AppLink>
              <button type="button" className="rms-btn rms-btn-primary" onClick={handleStartEdit}>
                ✏️ Chỉnh sửa thông tin
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

        {!ownerId ? (
          <div className="rms-empty-state">
            <h2>Chưa chọn tài khoản Nhà tuyển dụng (Recruiter)</h2>
            <p>
              Hãy chọn một tài khoản Recruiter từ danh sách trên thanh <strong>DEV MODE</strong>{' '}
              hoặc bấm <strong>&quot;+ Tạo Recruiter mới&quot;</strong> để bắt đầu.
            </p>
          </div>
        ) : loading ? (
          <div className="rms-loading-state">Đang kiểm tra hồ sơ công ty của bạn...</div>
        ) : !company && !isEditing ? null : company && !isEditing ? (
          /* Chế độ Xem chi tiết thông tin công ty của Recruiter (UC13.1) */
          <div className="rms-detail-grid">
            <div className="rms-detail-main">
              <section className="rms-card">
                <div className="rms-company-profile-header">
                  <div className="rms-job-card-logo rms-logo-lg">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} />
                    ) : (
                      <div className="rms-logo-fallback">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="rms-detail-title">{company.name}</h2>
                    <div className="rms-detail-badges">
                      {company.industry && (
                        <span className="rms-badge rms-badge-info">🏢 {company.industry}</span>
                      )}
                      {company.size && (
                        <span className="rms-badge rms-badge-purple">👥 {company.size}</span>
                      )}
                      {company.address && (
                        <span className="rms-badge rms-badge-neutral">📍 {company.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="rms-section-title">Giới thiệu doanh nghiệp</h3>
                <div className="rms-prose">
                  {company.description || 'Chưa có mô tả chi tiết về công ty.'}
                </div>
              </section>
            </div>

            <aside className="rms-detail-sidebar">
              <div className="rms-card">
                <h2 className="rms-section-title">Thông tin hồ sơ</h2>
                <dl className="rms-info-list">
                  <div className="rms-info-item">
                    <dt>Mã công ty:</dt>
                    <dd>
                      <code>{company.id.slice(0, 8)}...</code>
                    </dd>
                  </div>
                  <div className="rms-info-item">
                    <dt>Ngành nghề:</dt>
                    <dd>{company.industry || 'Chưa cập nhật'}</dd>
                  </div>
                  <div className="rms-info-item">
                    <dt>Quy mô:</dt>
                    <dd>{company.size || 'Chưa cập nhật'}</dd>
                  </div>
                  <div className="rms-info-item">
                    <dt>Địa chỉ:</dt>
                    <dd>{company.address || 'Chưa cập nhật'}</dd>
                  </div>
                  <div className="rms-info-item">
                    <dt>Website:</dt>
                    <dd>
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noreferrer">
                          {company.website}
                        </a>
                      ) : (
                        'Chưa cập nhật'
                      )}
                    </dd>
                  </div>
                  <div className="rms-info-item">
                    <dt>Ngày tạo:</dt>
                    <dd>{formatDate(company.createdAt)}</dd>
                  </div>
                  <div className="rms-info-item">
                    <dt>Cập nhật lần cuối:</dt>
                    <dd>{formatDate(company.updatedAt)}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="rms-btn rms-btn-primary rms-btn-block"
                  onClick={handleStartEdit}
                >
                  ✏️ Chỉnh sửa hồ sơ công ty
                </button>
              </div>
            </aside>
          </div>
        ) : (
          /* Chế độ Tạo mới (UC13.2) hoặc Chỉnh sửa (UC13.3) */
          <div className="rms-detail-grid">
            <div className="rms-detail-main">
              {!company && (
                <div className="rms-alert rms-alert-info">
                  <div>
                    <strong>Thiết lập công ty lần đầu (UC13.2 &amp; BR-04):</strong> Tài khoản
                    Recruiter này chưa có công ty. Vui lòng hoàn thành biểu mẫu dưới đây để kích
                    hoạt quyền đăng tin tuyển dụng.
                  </div>
                </div>
              )}

              <form className="rms-card rms-form" onSubmit={(e) => void handleSubmit(e)}>
                <h2 className="rms-section-title">
                  {company
                    ? 'Cập nhật thông tin công ty (UC13.3)'
                    : 'Tạo hồ sơ công ty mới (UC13.2)'}
                </h2>

                <div className="rms-form-grid">
                  <div className="rms-field rms-field-full">
                    <label htmlFor="company-name" className="rms-label">
                      Tên công ty <span className="rms-required">*</span>
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={200}
                      className="rms-input"
                      placeholder="VD: Công ty Cổ phần Công nghệ TechCorp Việt Nam"
                      value={form.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                    />
                  </div>

                  <div className="rms-field">
                    <label htmlFor="company-industry" className="rms-label">
                      Ngành nghề hoạt động
                    </label>
                    <input
                      id="company-industry"
                      type="text"
                      list="industry-suggestions"
                      maxLength={100}
                      className="rms-input"
                      placeholder="VD: Công nghệ thông tin"
                      value={form.industry}
                      onChange={(e) => handleFieldChange('industry', e.target.value)}
                    />
                    <datalist id="industry-suggestions">
                      {INDUSTRY_SUGGESTIONS.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </div>

                  <div className="rms-field">
                    <label htmlFor="company-size" className="rms-label">
                      Quy mô nhân sự
                    </label>
                    <select
                      id="company-size"
                      className="rms-select"
                      value={form.size}
                      onChange={(e) => handleFieldChange('size', e.target.value)}
                    >
                      <option value="">-- Chọn quy mô công ty --</option>
                      {COMPANY_SIZE_OPTIONS.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rms-field">
                    <label htmlFor="company-address" className="rms-label">
                      Địa chỉ trụ sở
                    </label>
                    <input
                      id="company-address"
                      type="text"
                      maxLength={255}
                      className="rms-input"
                      placeholder="VD: Tầng 12, Tòa nhà Keangnam, Cầu Giấy, Hà Nội"
                      value={form.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                    />
                  </div>

                  <div className="rms-field">
                    <label htmlFor="company-website" className="rms-label">
                      Website chính thức
                    </label>
                    <input
                      id="company-website"
                      type="url"
                      maxLength={255}
                      className="rms-input"
                      placeholder="https://example.com"
                      value={form.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                    />
                  </div>

                  <div className="rms-field rms-field-full">
                    <label htmlFor="company-logoUrl" className="rms-label">
                      Đường dẫn ảnh Logo (URL)
                    </label>
                    <input
                      id="company-logoUrl"
                      type="text"
                      maxLength={500}
                      className="rms-input"
                      placeholder="https://example.com/logo.png"
                      value={form.logoUrl}
                      onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                    />
                  </div>

                  <div className="rms-field rms-field-full">
                    <label htmlFor="company-logo-file" className="rms-label">
                      Hoặc tải lên file ảnh Logo từ máy tính (StorageService)
                    </label>
                    {/* TODO: Kết nối API upload file StorageService của Oanh */}
                    <input
                      id="company-logo-file"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="rms-file-input"
                      onChange={handleFileInputChange}
                    />
                    {uploadTodoNotice && <p className="rms-todo-hint">{uploadTodoNotice}</p>}
                  </div>

                  <div className="rms-field rms-field-full">
                    <label htmlFor="company-description" className="rms-label">
                      Mô tả giới thiệu công ty ({form.description.length}/2000 ký tự)
                    </label>
                    <textarea
                      id="company-description"
                      rows={6}
                      maxLength={2000}
                      className="rms-textarea"
                      placeholder="Giới thiệu về lĩnh vực hoạt động, văn hóa doanh nghiệp, chế độ đãi ngộ..."
                      value={form.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                    />
                  </div>
                </div>

                <div className="rms-form-actions">
                  {company && (
                    <button
                      type="button"
                      className="rms-btn rms-btn-outline"
                      disabled={saving}
                      onClick={handleCancelEdit}
                    >
                      Hủy bỏ
                    </button>
                  )}

                  <button type="submit" className="rms-btn rms-btn-primary" disabled={saving}>
                    {saving ? 'Đang lưu...' : company ? 'Lưu thay đổi' : 'Tạo hồ sơ công ty'}
                  </button>
                </div>
              </form>
            </div>

            {/* Khung xem trước (Live Preview) */}
            <aside className="rms-detail-sidebar">
              <div className="rms-card">
                <h2 className="rms-section-title">Xem trước thẻ công ty</h2>
                <div className="rms-company-preview-box">
                  <div className="rms-job-card-logo rms-logo-lg">
                    {form.logoUrl.trim() ? (
                      <img
                        src={form.logoUrl.trim()}
                        alt={form.name || 'Logo preview'}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="rms-logo-fallback">
                        {(form.name.trim() || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h3 className="rms-preview-name">{form.name.trim() || 'Tên công ty của bạn'}</h3>

                  <p className="rms-muted">{form.industry.trim() || 'Ngành nghề hoạt động'}</p>

                  <div className="rms-detail-badges">
                    {form.size && (
                      <span className="rms-badge rms-badge-purple">👥 {form.size}</span>
                    )}
                    {form.address && (
                      <span className="rms-badge rms-badge-neutral">📍 {form.address}</span>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
