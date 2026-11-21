import { Role } from '@prisma/client';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };
