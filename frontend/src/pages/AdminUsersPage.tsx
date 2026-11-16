import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchAdminUsers,
  lockAdminUser,
  unlockAdminUser,
  type AdminUserItem,
} from '../api/admin.api';
import { Pagination } from '../components/Pagination';
import { AppLink } from '../components/Router';
import type { PaginationMeta, Role } from '../types/models';
import { formatDate } from '../utils/formatters';

const ROLE_LABELS: Record<Role, string> = {
  CANDIDATE: 'Ứng viên (CANDIDATE)',
  RECRUITER: 'Nhà tuyển dụng (RECRUITER)',
  ADMIN: 'Quản trị viên (ADMIN)',
};

export function AdminUsersPage() {
  const [keyword, setKeyword] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [lockFilter, setLockFilter] = useState<'true' | 'false' | ''>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal xác nhận Khóa / Mở khóa tài khoản
  const [confirmUser, setConfirmUser] = useState<{
    action: 'lock' | 'unlock';
    user: AdminUserItem;
  } | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchAdminUsers({
          page,
          pageSize,
          role: roleFilter,
          isLocked: lockFilter,
          keyword: appliedKeyword || undefined,
        });
        if (!cancelled) {
          setUsers(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Không thể tải danh sách người dùng hệ thống',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, roleFilter, lockFilter, appliedKeyword, reloadKey]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const handleResetFilters = () => {
    setKeyword('');
    setAppliedKeyword('');
    setRoleFilter('');
    setLockFilter('');
    setPage(1);
  };

  const handleExecuteLockToggle = async () => {
    if (!confirmUser) return;
    setProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (confirmUser.action === 'lock') {
        await lockAdminUser(confirmUser.user.id);
        setSuccessMsg(
          `Đã khóa tài khoản "${confirmUser.user.email}" và thu hồi toàn bộ Refresh Token đang hoạt động (BR-06)!`,
        );
      } else {
        await unlockAdminUser(confirmUser.user.id);
        setSuccessMsg(`Đã mở khóa tài khoản "${confirmUser.user.email}" thành công!`);
      }
      setConfirmUser(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Thao tác khóa/mở khóa thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadgeClass = (role: Role): string => {
    switch (role) {
      case 'ADMIN':
        return 'rms-badge rms-badge-purple';
      case 'RECRUITER':
        return 'rms-badge rms-badge-info';
      case 'CANDIDATE':
      default:
        return 'rms-badge rms-badge-neutral';
    }
  };

  return (
    <div className="rms-page">
      <div className="rms-container rms-page-section">
        {/* Thanh chuyển phân hệ Admin */}
        <div className="rms-admin-nav-tabs">
          <AppLink to="/admin/users" className="rms-admin-tab active">
            👥 Quản lý người dùng (UC21 · UC22)
          </AppLink>
          <AppLink to="/admin/jobs" className="rms-admin-tab">
            📋 Duyệt tin tuyển dụng (UC23)
          </AppLink>
        </div>

        <div className="rms-page-header">
          <div>
            <h1 className="rms-page-title">
              Quản lý người dùng &amp; Khóa tài khoản (UC21 · UC22)
            </h1>
            <p className="rms-muted">
              Tìm kiếm, lọc tài khoản theo vai trò và trạng thái; khóa tài khoản vi phạm kèm thu hồi
              toàn bộ phiên đăng nhập theo <strong>BR-06</strong>.
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

        {/* Bộ lọc danh sách người dùng */}
        <form className="rms-filter-bar" onSubmit={handleSearchSubmit}>
          <div className="rms-filter-bar-left">
            <input
              type="text"
              className="rms-input rms-filter-search-input"
              placeholder="Tìm theo email hoặc họ tên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <select
              className="rms-select rms-filter-status-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as Role | '');
                setPage(1);
              }}
              aria-label="Lọc theo vai trò"
            >
              <option value="">Tất cả vai trò</option>
              <option value="CANDIDATE">Ứng viên (CANDIDATE)</option>
              <option value="RECRUITER">Nhà tuyển dụng (RECRUITER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>

            <select
              className="rms-select rms-filter-status-select"
              value={lockFilter}
              onChange={(e) => {
                setLockFilter(e.target.value as 'true' | 'false' | '');
                setPage(1);
              }}
              aria-label="Lọc theo trạng thái khóa"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="false">🟢 Đang hoạt động</option>
              <option value="true">🔴 Đã bị khóa</option>
            </select>

            <button type="submit" className="rms-btn rms-btn-primary">
              Tìm kiếm
            </button>

            {(appliedKeyword || roleFilter || lockFilter) && (
              <button
                type="button"
                className="rms-btn rms-btn-outline"
                onClick={handleResetFilters}
              >
                Đặt lại
              </button>
            )}
          </div>

          <div className="rms-results-controls">
            <span className="rms-results-summary">
              Tổng: <strong>{meta.total}</strong> tài khoản
            </span>
            <select
              className="rms-select rms-select-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Số dòng mỗi trang"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </form>

        {loading ? (
          <div className="rms-loading-state">Đang tải danh sách người dùng...</div>
        ) : users.length === 0 ? (
          <div className="rms-empty-state">
            <h3>Không tìm thấy người dùng nào</h3>
            <p>Không có tài khoản nào khớp với điều kiện tìm kiếm và bộ lọc hiện tại.</p>
            <button type="button" className="rms-btn rms-btn-primary" onClick={handleResetFilters}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="rms-table-card">
              <table className="rms-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Công ty (Recruiter)</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th className="rms-text-right">Thao tác (UC22)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.isLocked ? 'rms-row-locked' : ''}>
                      <td>
                        <div className="rms-user-cell">
                          <div className="rms-user-avatar">
                            {(u.fullName || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="rms-user-name">{u.fullName}</div>
                            <div className="rms-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={getRoleBadgeClass(u.role)}>{ROLE_LABELS[u.role]}</span>
                      </td>

                      <td>
                        {u.company ? (
                          <AppLink
                            to={`/companies/${u.company.id}`}
                            className="rms-company-table-link"
                          >
                            🏢 {u.company.name}
                          </AppLink>
                        ) : u.role === 'RECRUITER' ? (
                          <span className="rms-muted">Chưa tạo công ty</span>
                        ) : (
                          <span className="rms-muted">—</span>
                        )}
                      </td>

                      <td>
                        {u.isLocked ? (
                          <span className="rms-badge rms-badge-status-rejected">🔴 Đã khóa</span>
                        ) : (
                          <span className="rms-badge rms-badge-status-approved">🟢 Hoạt động</span>
                        )}
                      </td>

                      <td>{formatDate(u.createdAt)}</td>

                      <td className="rms-text-right">
                        {u.role === 'ADMIN' ? (
                          <button
                            type="button"
                            className="rms-btn rms-btn-outline rms-btn-sm"
                            disabled
                            title="Không thể khóa tài khoản Quản trị viên (ADMIN)"
                          >
                            🛡️ Quản trị viên
                          </button>
                        ) : u.isLocked ? (
                          <button
                            type="button"
                            className="rms-btn rms-btn-primary rms-btn-sm"
                            onClick={() => setConfirmUser({ action: 'unlock', user: u })}
                          >
                            🔓 Mở khóa
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rms-btn rms-btn-danger-outline rms-btn-sm"
                            onClick={() => setConfirmUser({ action: 'lock', user: u })}
                          >
                            🔒 Khóa tài khoản
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={meta} onPageChange={(nextPage) => setPage(nextPage)} />
          </>
        )}
      </div>

      {/* Modal xác nhận Khóa / Mở khóa tài khoản (UC22 & BR-06) */}
      {confirmUser && (
        <div className="rms-modal-backdrop" role="dialog" aria-modal="true">
          <div className="rms-modal">
            <h3 className="rms-modal-title">
              {confirmUser.action === 'lock'
                ? 'Xác nhận khóa tài khoản người dùng (UC22 · BR-06)'
                : 'Xác nhận mở khóa tài khoản (UC22)'}
            </h3>

            <div className="rms-modal-body">
              {confirmUser.action === 'lock' ? (
                <>
                  <p>
                    Bạn có chắc chắn muốn <strong>khóa</strong> tài khoản của{' '}
                    <strong>{confirmUser.user.fullName}</strong> (
                    <code>{confirmUser.user.email}</code>)?
                  </p>
                  <div
                    className="rms-alert rms-alert-warning"
                    style={{ marginTop: 12, marginBottom: 0 }}
                  >
                    <div>
                      <strong>Quy tắc BR-06:</strong> Ngay sau khi khóa, người dùng này sẽ không thể
                      đăng nhập mới và <strong>toàn bộ Refresh Token đang hoạt động</strong> của họ
                      sẽ bị thu hồi ngay lập tức.
                    </div>
                  </div>
                </>
              ) : (
                <p>
                  Bạn có chắc chắn muốn <strong>mở khóa</strong> cho tài khoản{' '}
                  <strong>{confirmUser.user.fullName}</strong> (
                  <code>{confirmUser.user.email}</code>) để người dùng có thể đăng nhập trở lại?
                </p>
              )}
            </div>

            <div className="rms-modal-actions">
              <button
                type="button"
                className="rms-btn rms-btn-outline"
                disabled={processing}
                onClick={() => setConfirmUser(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`rms-btn ${
                  confirmUser.action === 'lock' ? 'rms-btn-danger' : 'rms-btn-primary'
                }`}
                disabled={processing}
                onClick={() => void handleExecuteLockToggle()}
              >
                {processing
                  ? 'Đang xử lý...'
                  : confirmUser.action === 'lock'
                    ? 'Xác nhận Khóa & Thu hồi Token'
                    : 'Xác nhận Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
