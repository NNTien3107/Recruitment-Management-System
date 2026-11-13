import React, { useEffect, useState } from 'react';
import { cvApi, CvItem } from '../../api/cvApi';

export const CvsPage: React.FC = () => {
  const [cvs, setCvs] = useState<CvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Upload Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvName, setCvName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadCvs();
  }, []);

  const loadCvs = async () => {
    try {
      setLoading(true);
      const data = await cvApi.getCvs();
      setCvs(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Lỗi tải danh sách CV: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Kiểm tra dung lượng client <= 5MB
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Kích thước file không được vượt quá 5MB' });
        setSelectedFile(null);
        return;
      }

      // Kiểm tra định dạng đuôi file
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
        setMessage({
          type: 'error',
          text: 'Chỉ chấp nhận file định dạng PDF hoặc Word (.docx, .doc)',
        });
        setSelectedFile(null);
        return;
      }

      setMessage(null);
      setSelectedFile(file);
      if (!cvName) {
        // Tự động gợi ý tên từ tên file
        setCvName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file CV trước khi tải lên' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);
      await cvApi.uploadCv(selectedFile, cvName, isDefault);
      setMessage({ type: 'success', text: 'Tải lên CV thành công!' });
      setSelectedFile(null);
      setCvName('');
      setIsDefault(false);
      await loadCvs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Lỗi khi upload CV: ${msg}` });
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await cvApi.setDefault(id);
      await loadCvs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Không thể đặt làm mặc định: ${msg}` });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}"?`)) return;

    try {
      await cvApi.deleteCv(id);
      setMessage({ type: 'success', text: 'Đã xóa CV thành công' });
      await loadCvs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Không thể xóa CV: ${msg}` });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ maxWidth: '950px', margin: '32px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          Upload và quản lý CV (UC08)
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Hỗ trợ định dạng PDF, DOCX (tối đa 5MB). File được lưu trữ bảo mật và mã hóa tên ngẫu nhiên.
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

      {/* Form Upload */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0 }}>
          Tải lên CV mới
        </h2>

        <form onSubmit={handleUpload}>
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
            onClick={() => document.getElementById('cv-file-input')?.click()}
          >
            <input
              id="cv-file-input"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#334155' }}>
              {selectedFile ? (
                <span style={{ color: '#2563eb' }}>{selectedFile.name}</span>
              ) : (
                'Nhấn vào đây để chọn file CV từ máy tính'
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Chỉ chấp nhận file PDF hoặc Word (tối đa 5MB)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tên gợi nhớ cho CV (VD: CV Tiếng Anh 2026)"
              value={cvName}
              onChange={(e) => setCvName(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
              }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Đặt làm CV mặc định
            </label>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                opacity: !selectedFile || uploading ? 0.6 : 1,
              }}
            >
              {uploading ? 'Đang tải lên...' : 'Tải lên CV'}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách CV */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Danh sách CV đã lưu ({cvs.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Đang tải danh sách CV...
          </div>
        ) : cvs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
            }}
          >
            Bạn chưa có CV nào trong hệ thống. Hãy tải lên CV đầu tiên để bắt đầu ứng tuyển!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {cvs.map((cv) => (
              <div
                key={cv.id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: `1px solid ${cv.isDefault ? '#93c5fd' : '#e5e7eb'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: cv.isDefault ? '0 2px 6px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: cv.mimeType?.includes('pdf') ? '#fee2e2' : '#dbeafe',
                      color: cv.mimeType?.includes('pdf') ? '#dc2626' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {cv.mimeType?.includes('pdf') ? 'PDF' : 'DOCX'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {cv.name}
                      </span>
                      {cv.isDefault && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#dbeafe',
                            color: '#1d4ed8',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          CV Mặc định
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                      {cv.originalName} • {formatFileSize(cv.fileSize)} • Ngày tải:{' '}
                      {new Date(cv.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!cv.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(cv.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        fontSize: '13px',
                        color: '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      Đặt làm mặc định
                    </button>
                  )}

                  <a
                    href={cvApi.getDownloadUrl(cv.id)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      fontSize: '13px',
                      fontWeight: '500',
                      textDecoration: 'none',
                    }}
                  >
                    Tải về
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(cv.id, cv.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #fee2e2',
                      backgroundColor: '#fef2f2',
                      fontSize: '13px',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

