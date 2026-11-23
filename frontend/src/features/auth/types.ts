export type Role = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
