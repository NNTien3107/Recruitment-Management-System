import type { Role } from './types';

/** Trang chủ của từng vai trò sau khi đăng nhập. */
export function homePathForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'RECRUITER':
      return '/recruiter';
    case 'CANDIDATE':
      return '/candidate';
  }
}
