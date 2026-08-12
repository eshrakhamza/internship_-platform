import apiClient from '../lib/api-client';

export interface DashboardStats {
  users: { total: number; active: number; inactive: number; recentSignups: number; byRole: Record<string, number> };
  postings: { total: number; published: number; draftOrArchived: number };
  applications: { total: number; byStatus: Record<string, number> };
  campaigns: { total: number; published: number };
  assessments: { totalAttempts: number; completedAttempts: number; inProgress: number };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  candidate?: { school: string | null; academicLevel: string | null; preferredTheme: string | null } | null;
}

export interface UsersQuery {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: string;
  search?: string;
}

export interface PaginatedUsers {
  data: AdminUser[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },
  getUsers: async (params: UsersQuery): Promise<PaginatedUsers> => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },
  updateUserRole: async (id: string, role: string) => {
    const res = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },
  updateUserStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
    return res.data;
  },
};