import React, { useEffect, useState } from 'react';
import {
  applicationApi,
  ApplicationItem,
  ApplicationStatus,
} from '../../api/applicationApi';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

// Các trạng thái tiếp theo hợp lệ theo state machine
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ['REVIEWING', 'REJECTED', 'WITHDRAWN'],
  REVIEWING: ['INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW_SCHEDULED: ['OFFERED', 'REVIEWING', 'REJECTED', 'WITHDRAWN'],
  OFFERED: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Đã nộp đơn',
  REVIEWING: 'Đang xem xét hồ sơ',
  INTERVIEW_SCHEDULED: 'Lên lịch phỏng vấn',
  OFFERED: 'Gửi lời mời nhận việc (Offer)',
  ACCEPTED: 'Chấp nhận offer / Trúng tuyển',
  REJECTED: 'Từ chối ứng viên',
  WITHDRAWN: 'Ứng viên rút đơn',
};

export const JobApplicantsPage: React.FC = () => {
  const [jobId, setJobId] = useState('00000000-0000-0000-0000-000000000010');
  const [applicants, setApplicants] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Detail Modal state (UC17)
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // Status Change Modal state (UC18)
  const [statusModalApp, setStatusModalApp] = useState<ApplicationItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (jobId.trim()) {
      loadApplicants();
    }
  }, [statusFilter]);

  const loadApplicants = async () => {
    if (!jobId.trim()) return;
    try {
      setLoading(true);
      setMessage(null);
      const res = await applicationApi.getJobApplications(jobId.trim(), {
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      });
      setApplicants(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Không thể tải danh sách ứng viên: ${msg}` });
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (app: ApplicationItem) => {
    setStatusModalApp(app);
    const nextOptions = ALLOWED_TRANSITIONS[app.status] || [];
    setTargetStatus(nextOptions[0] || '');
    setStatusNote('');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalApp || !targetStatus) return;

    try {
      setUpdatingStatus(true);
      await applicationApi.updateStatus(statusModalApp.id, {
        status: targetStatus as ApplicationStatus,
        note: statusNote,
      });
      setMessage({
        type: 'success',
        text: `Đã cập nhật trạng thái đơn sang "${STATUS_LABELS[targetStatus as ApplicationStatus]}" thành công (UC18)!`,
      });
      setStatusModalApp(null);
      await loadApplicants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Lỗi khi đổi trạng thái: ${msg}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '32px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          Quản lý ứng viên phía Nhà tuyển dụng (UC16, UC17, UC18)
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Xem danh sách ứng viên theo tin tuyển dụng, xem chi tiết hồ sơ, tải file CV và chuyển đổi trạng thái hồ sơ.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Bar nhập Job ID và Tìm kiếm */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '4px' }}>
              Mã tin tuyển dụng (Job ID) *
            </label>
            <input
              type="text"
              placeholder="Nhập Job ID UUID"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '4px' }}>
              Tìm kiếm ứng viên
            </label>
            <input
              type="text"
              placeholder="Tên hoặc email ứng viên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadApplicants()}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '4px' }}>
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                height: '38px',
              }}
            >
              <option value="">Tất cả</option>
              <option value="APPLIED">Đã nộp đơn</option>
              <option value="REVIEWING">Đang xem xét</option>
              <option value="INTERVIEW_SCHEDULED">Lịch phỏng vấn</option>
              <option value="OFFERED">Đã gửi Offer</option>
              <option value="ACCEPTED">Trúng tuyển</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={loadApplicants}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                height: '38px',
                cursor: 'pointer',
              }}
            >
              Tải danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Bảng ứng viên */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Đang tải dữ liệu ứng viên...
          </div>
        ) : applicants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Chưa có ứng viên nào nộp hồ sơ cho tin tuyển dụng này hoặc không tìm thấy dữ liệu.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <tr>
                <th style={{ padding: '14px 20px' }}>Ứng viên</th>
                <th style={{ padding: '14px 20px' }}>Chức danh hồ sơ</th>
                <th style={{ padding: '14px 20px' }}>Ngày nộp</th>
                <th style={{ padding: '14px 20px' }}>CV đính kèm</th>
                <th style={{ padding: '14px 20px' }}>Trạng thái</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>
                      {app.candidate?.fullName || 'Ứng viên'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {app.candidate?.email}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#4b5563' }}>
                    {app.candidate?.candidateProfile?.title || 'Chưa cập nhật'}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#6b7280' }}>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <a
                      href={applicationApi.getApplicantCvDownloadUrl(app.id)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: '500',
                      }}
                    >
                      📄 Tải CV
                    </a>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={app.status} />
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Hồ sơ (UC17)
                      </button>

                      {ALLOWED_TRANSITIONS[app.status]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(app)}
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Đổi trạng thái (UC18)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Chi tiết hồ sơ ứng viên (UC17) */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Chi tiết hồ sơ ứng viên (UC17)"
          maxWidth="700px"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                {selectedApp.candidate?.fullName}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                {selectedApp.candidate?.email} • {selectedApp.candidate?.candidateProfile?.phone || 'Chưa có SĐT'}
              </div>
              {selectedApp.candidate?.candidateProfile?.address && (
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                  Địa chỉ: {selectedApp.candidate.candidateProfile.address}
                </div>
              )}
            </div>

            <a
              href={applicationApi.getApplicantCvDownloadUrl(selectedApp.id)}
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Tải CV ứng viên
            </a>
          </div>

          {selectedApp.candidate?.candidateProfile?.bio && (
            <div style={{ backgroundColor: '#f9fafb', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Giới thiệu bản thân
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#374151' }}>
                {selectedApp.candidate.candidateProfile.bio}
              </p>
            </div>
          )}

          {/* Kỹ năng */}
          {selectedApp.candidate?.candidateProfile?.skills && selectedApp.candidate.candidateProfile.skills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
                Kỹ năng chuyên môn
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedApp.candidate.candidateProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {selectedApp.coverLetter && (
            <div style={{ backgroundColor: '#fefce8', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fef08a' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#a16207', textTransform: 'uppercase' }}>
                Thư ngỏ / Lời nhắn ứng tuyển
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#713f12', whiteSpace: 'pre-wrap' }}>
                {selectedApp.coverLetter}
              </p>
            </div>
          )}

          {/* Lịch sử trạng thái */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Tiến trình xử lý hồ sơ
            </div>
            <div style={{ paddingLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
              {selectedApp.statusHistory?.map((h, i) => (
                <div key={h.id || i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={h.toStatus} />
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {h.note && (
                    <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>
                      Ghi chú: {h.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cập nhật trạng thái (UC18) */}
      {statusModalApp && (
        <Modal
          isOpen={!!statusModalApp}
          onClose={() => setStatusModalApp(null)}
          title="Cập nhật trạng thái ứng viên (UC18)"
        >
          <form onSubmit={handleStatusSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>
                Ứng viên: <strong>{statusModalApp.candidate?.fullName}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                Trạng thái hiện tại: <StatusBadge status={statusModalApp.status} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Chuyển sang trạng thái tiếp theo *
              </label>
              <select
                required
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                {ALLOWED_TRANSITIONS[statusModalApp.status]?.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]} ({st})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Ghi chú / Lý do thay đổi (được lưu vào lịch sử)
              </label>
              <textarea
                rows={3}
                placeholder="VD: Đã hoàn thành phỏng vấn kỹ thuật vòng 1, hẹn lịch vòng 2..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStatusModalApp(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: updatingStatus ? 'not-allowed' : 'pointer',
                }}
              >
                {updatingStatus ? 'Đang cập nhật...' : 'Xác nhận chuyển trạng thái'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

