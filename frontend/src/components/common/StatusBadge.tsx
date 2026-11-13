import React from 'react';
import { ApplicationStatus } from '../../api/applicationApi';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const statusConfig: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  APPLIED: {
    label: 'Đã nộp đơn',
    bg: '#eff6ff',
    text: '#1d4ed8',
    border: '#bfdbfe',
  },
  REVIEWING: {
    label: 'Đang xem xét',
    bg: '#fefce8',
    text: '#a16207',
    border: '#fef08a',
  },
  INTERVIEW_SCHEDULED: {
    label: 'Lịch phỏng vấn',
    bg: '#faf5ff',
    text: '#7e22ce',
    border: '#e9d5ff',
  },
  OFFERED: {
    label: 'Đã gửi Offer',
    bg: '#ecfeff',
    text: '#0e7490',
    border: '#a5f3fc',
  },
  ACCEPTED: {
    label: 'Trúng tuyển',
    bg: '#f0fdf4',
    text: '#15803d',
    border: '#bbf7d0',
  },
  REJECTED: {
    label: 'Từ chối',
    bg: '#fef2f2',
    text: '#b91c1c',
    border: '#fecaca',
  },
  WITHDRAWN: {
    label: 'Đã rút đơn',
    bg: '#f3f4f6',
    text: '#4b5563',
    border: '#e5e7eb',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: '#f3f4f6',
    text: '#374151',
    border: '#d1d5db',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.text,
          marginRight: '6px',
        }}
      />
      {config.label}
    </span>
  );
};

