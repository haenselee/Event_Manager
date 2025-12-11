export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}
