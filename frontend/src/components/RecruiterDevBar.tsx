import { useEffect, useState, type FormEvent } from 'react';
import {
  createQuickRecruiterAccount,
  fetchRecruiterAccounts,
  type UserSummary,
} from '../api/users.api';
import { setStoredRecruiterId } from '../utils/recruiter-context';

interface RecruiterDevBarProps {
  ownerId: string;
  onOwnerIdChange: (nextOwnerId: string) => void;
}

export function RecruiterDevBar({ ownerId, onOwnerIdChange }: RecruiterDevBarProps) {
  const [recruiters, setRecruiters] = useState<UserSummary[]>([]);
  const [manualInput, setManualInput] = useState<string>(ownerId);
  const [creating, setCreating] = useState<boolean>(false);
  const [devError, setDevError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadRecruiters = async () => {
      try {
        const list = await fetchRecruiterAccounts();
        if (!cancelled) {
          setRecruiters(list);
          // Nếu chưa chọn ownerId nào trong localStorage thì tự chọn Recruiter đầu tiên để tiện test
          if (!ownerId && list.length > 0) {
            setStoredRecruiterId(list[0].id);
            setManualInput(list[0].id);
            onOwnerIdChange(list[0].id);
          }
        }
      } catch {
        // Bỏ qua nếu chưa bật backend
      }
    };

    void loadRecruiters();
    return () => {
      cancelled = true;
    };
  }, [ownerId, onOwnerIdChange]);

  const handleSelectChange = (selectedId: string) => {
    setDevError(null);
    setManualInput(selectedId);
    setStoredRecruiterId(selectedId);
    onOwnerIdChange(selectedId);
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDevError(null);
    const trimmed = manualInput.trim();
    setStoredRecruiterId(trimmed);
    onOwnerIdChange(trimmed);
  };

  const handleCreateQuickRecruiter = async () => {
    setCreating(true);
    setDevError(null);
    try {
      const created = await createQuickRecruiterAccount('');
      setRecruiters((prev) => [created, ...prev]);
      setManualInput(created.id);
      setStoredRecruiterId(created.id);
      onOwnerIdChange(created.id);
    } catch (err) {
      setDevError(err instanceof Error ? err.message : 'Không thể tạo nhanh tài khoản Recruiter');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rms-dev-bar">
      <div className="rms-container rms-dev-bar-inner">
        <div className="rms-dev-bar-label">
          <span className="rms-dev-badge">DEV MODE</span>
          <span>
            {/* TODO: Lấy user.id từ AuthContext sau khi ghép Auth */}
            Tài khoản Recruiter đang giả lập (<code>ownerId</code>):
          </span>
        </div>

        <div className="rms-dev-bar-controls">
          {recruiters.length > 0 && (
            <select
              className="rms-select rms-select-sm rms-dev-select"
              value={recruiters.some((r) => r.id === ownerId) ? ownerId : ''}
              onChange={(e) => handleSelectChange(e.target.value)}
              aria-label="Chọn nhanh tài khoản Recruiter"
            >
              <option value="">-- Chọn từ danh sách Recruiter --</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} ({r.email})
                </option>
              ))}
            </select>
          )}

          <form className="rms-dev-manual-form" onSubmit={handleManualSubmit}>
            <input
              type="text"
              className="rms-input rms-input-sm rms-dev-input"
              placeholder="Nhập UUID v4 của Recruiter..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <button type="submit" className="rms-btn rms-btn-outline rms-btn-sm">
              Áp dụng ID
            </button>
          </form>

          <button
            type="button"
            className="rms-btn rms-btn-primary rms-btn-sm"
            disabled={creating}
            onClick={() => void handleCreateQuickRecruiter()}
            title="Tạo ngay 1 tài khoản Recruiter mới chưa có công ty để test luồng Tạo hồ sơ công ty (UC13.2)"
          >
            {creating ? 'Đang tạo...' : '+ Tạo Recruiter mới (test tạo công ty)'}
          </button>
        </div>

        {devError && <div className="rms-dev-error">{devError}</div>}
      </div>
    </div>
  );
}
