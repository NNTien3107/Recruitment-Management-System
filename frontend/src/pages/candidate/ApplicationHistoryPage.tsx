import React, { useEffect, useState } from 'react';
import {
  applicationApi,
  ApplicationItem,
  ApplicationStatus,
} from '../../api/applicationApi';
import { cvApi, CvItem } from '../../api/cvApi';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

export const ApplicationHistoryPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [keyword, setKeyword] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cvList, setCvList] = useState<CvItem[]>([]);
  const [applyJobId, setApplyJobId] = useState('');
  const [applyCvId, setApplyCvId] = useState('');
  const [applyCoverLetter, setApplyCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getMyApplications({
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      });
      setApplications(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Lỗi tải lịch sử ứng tuyển: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  const openApplyModal = async () => {
    try {
      const cvs = await cvApi.getCvs();
      setCvList(cvs);
      const defaultCv = cvs.find((c) => c.isDefault) || cvs[0];
      if (defaultCv) setApplyCvId(defaultCv.id);
      setIsApplyModalOpen(true);
    } catch {
      alert('Vui lòng tải lên ít nhất 1 CV trong trang Quản lý CV trước khi nộp đơn');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJobId || !applyCvId) {
      alert('Vui lòng nhập Job ID và chọn CV ứng tuyển');
      return;
    }

    try {
      setApplying(true);
      await applicationApi.applyJob({
        jobId: applyJobId,
        cvId: applyCvId,
        coverLetter: applyCoverLetter,
      });
      setMessage({ type: 'success', text: 'Nộp hồ sơ ứng tuyển thành công (UC09)!' });
      setIsApplyModalOpen(false);
      setApplyJobId('');
      setApplyCoverLetter('');
      await loadApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Không thể nộp đơn: ${msg}`);
    } finally {
      setApplying(false);
    }
  };

  const viewDetail = async (app: ApplicationItem) => {
    try {
      const detail = await applicationApi.getMyApplicationDetail(app.id);
      setSelectedApp(detail);
    } catch {
      setSelectedApp(app);
    }
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '32px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
            Lịch sử ứng tuyển (UC10)
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Theo dõi trạng thái và tiến trình xét duyệt toàn bộ các vị trí bạn đã nộp đơn.
          </p>
        </div>

        <button
          type="button"
          onClick={openApplyModal}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Ứng tuyển mới (UC09)
        </button>
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

      {/* Bộ lọc */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
        }}
      >
        <input
          type="text"
          placeholder="Tìm theo tiêu đề việc làm..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            backgroundColor: '#ffffff',
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="APPLIED">Đã nộp đơn</option>
          <option value="REVIEWING">Đang xem xét</option>
          <option value="INTERVIEW_SCHEDULED">Lịch phỏng vấn</option>
          <option value="OFFERED">Đã gửi Offer</option>
          <option value="ACCEPTED">Trúng tuyển</option>
          <option value="REJECTED">Từ chối</option>
          <option value="WITHDRAWN">Đã rút đơn</option>
        </select>

        <button
          type="button"
          onClick={loadApplications}
          style={{
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Tìm kiếm
        </button>
      </div>

      {/* Bảng danh sách đơn */}
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
            Đang tải lịch sử ứng tuyển...
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Chưa có đơn ứng tuyển nào phù hợp.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <tr>
                <th style={{ padding: '14px 20px' }}>Vị trí ứng tuyển</th>
                <th style={{ padding: '14px 20px' }}>CV sử dụng</th>
                <th style={{ padding: '14px 20px' }}>Ngày nộp</th>
                <th style={{ padding: '14px 20px' }}>Trạng thái</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111827' }}>
                    {app.job?.title || `Job #${app.jobId.slice(0, 8)}`}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#4b5563' }}>
                    {app.cv?.name || app.cv?.originalName || 'CV đã nộp'}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#6b7280' }}>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={app.status} />
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => viewDetail(app)}
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
                      Xem tiến trình
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Xem tiến trình đơn ứng tuyển */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Tiến trình xét duyệt đơn ứng tuyển"
          maxWidth="600px"
        >
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              {selectedApp.job?.title || 'Vị trí ứng tuyển'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Ngày nộp: {new Date(selectedApp.createdAt).toLocaleString()}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>Trạng thái hiện tại:</span>
              <StatusBadge status={selectedApp.status} />
            </div>
          </div>

          {selectedApp.coverLetter && (
            <div
              style={{
                backgroundColor: '#f9fafb',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Thư giới thiệu / Lời nhắn
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap' }}>
                {selectedApp.coverLetter}
              </p>
            </div>
          )}

          {/* Dòng thời gian ApplicationStatusHistory */}
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Dòng thời gian lịch sử trạng thái
            </div>

            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e5e7eb' }}>
              {(!selectedApp.statusHistory || selectedApp.statusHistory.length === 0) && (
                <div style={{ color: '#6b7280', fontSize: '13px' }}>
                  Chưa có ghi nhận thay đổi trạng thái nào.
                </div>
              )}
              {selectedApp.statusHistory?.map((history, idx) => (
                <div key={history.id || idx} style={{ marginBottom: '20px', position: 'relative' }}>
                  {/* Dot indicator */}
                  <span
                    style={{
                      position: 'absolute',
                      left: '-31px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: idx === selectedApp.statusHistory!.length - 1 ? '#2563eb' : '#9ca3af',
                      border: '2px solid #ffffff',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={history.toStatus} />
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(history.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {history.note && (
                    <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px' }}>
                      {history.note}
                    </div>
                  )}
                  {history.changedBy && (
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      Cập nhật bởi: {history.changedBy.fullName} ({history.changedBy.role})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nộp đơn ứng tuyển (UC09) */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Nộp đơn ứng tuyển việc làm (UC09)"
      >
        <form onSubmit={handleApplySubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              ID Tin tuyển dụng (Job ID UUID) *
            </label>
            <input
              type="text"
              required
              placeholder="VD: 123e4567-e89b-12d3-a456-426614174000"
              value={applyJobId}
              onChange={(e) => setApplyJobId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Chọn CV ứng tuyển *
            </label>
            <select
              value={applyCvId}
              onChange={(e) => setApplyCvId(e.target.value)}
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
              {cvList.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name} {cv.isDefault ? '(Mặc định)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Thư giới thiệu (Cover Letter)
            </label>
            <textarea
              rows={4}
              placeholder="Nêu bật lý do bạn phù hợp với vị trí này..."
              value={applyCoverLetter}
              onChange={(e) => setApplyCoverLetter(e.target.value)}
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
              onClick={() => setIsApplyModalOpen(false)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={applying}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontWeight: '600',
                cursor: applying ? 'not-allowed' : 'pointer',
              }}
            >
              {applying ? 'Đang gửi hồ sơ...' : 'Nộp hồ sơ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

