import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavbarProps {
  currentRole: 'CANDIDATE' | 'RECRUITER';
  onRoleChange: (role: 'CANDIDATE' | 'RECRUITER') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange }) => {
  const isCandidate = currentRole === 'CANDIDATE';

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 14px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: isActive ? '#2563eb' : '#4b5563',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
              R
            </span>
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#111827' }}>
              RMS Recruitment
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            {isCandidate ? (
              <>
                <NavLink to="/candidate/profile" style={linkStyle}>
                  Hồ sơ cá nhân (UC07)
                </NavLink>
                <NavLink to="/candidate/cvs" style={linkStyle}>
                  Quản lý CV (UC08)
                </NavLink>
                <NavLink to="/candidate/applications" style={linkStyle}>
                  Lịch sử ứng tuyển (UC10)
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/recruiter/jobs" style={linkStyle}>
                  Quản lý ứng viên (UC16, 17, 18)
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Role switcher & User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Chế độ xem:</span>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              padding: '3px',
              borderRadius: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => onRoleChange('CANDIDATE')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isCandidate ? '600' : '400',
                backgroundColor: isCandidate ? '#ffffff' : 'transparent',
                color: isCandidate ? '#111827' : '#6b7280',
                boxShadow: isCandidate ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
              }}
            >
              Ứng viên
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('RECRUITER')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: !isCandidate ? '600' : '400',
                backgroundColor: !isCandidate ? '#ffffff' : 'transparent',
                color: !isCandidate ? '#111827' : '#6b7280',
                boxShadow: !isCandidate ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
              }}
            >
              Nhà tuyển dụng
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

