'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { adminService, AdminUser } from '../../../services/admin-service';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const SW_BLUE = '#1e3a5f';
const ROLES = ['CANDIDATE', 'RECRUITER', 'ADMIN'];

export default function AdminUsersPage() {
  const { isLoading: authLoading } = useAuthGuard(['ADMIN']);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await adminService.getUsers({
          page,
          limit: 20,
          search: search || undefined,
          role: roleFilter || undefined,
          isActive: statusFilter || undefined,
        });
        setUsers(res.data);
        setMeta(res.meta);
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, statusFilter],
  );

  useEffect(() => {
    if (authLoading) return;
    fetchUsers(1);
  }, [authLoading, fetchUsers]);

  const handleRoleChange = async (id: string, role: string) => {
    setBusyId(id);
    try {
      await adminService.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as AdminUser['role'] } : u)));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to update role');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusToggle = async (user: AdminUser) => {
    setBusyId(user.id);
    try {
      await adminService.updateUserStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)),
      );
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
      <p className="text-sm text-slate-500 mt-1">{meta.total} total users</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          onClick={() => fetchUsers(1)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: SW_BLUE }}
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border border-slate-200 rounded-md px-2 py-1 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: u.isActive ? '#dcfce7' : '#fee2e2',
                        color: u.isActive ? '#166534' : '#991b1b',
                      }}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={busyId === u.id}
                      onClick={() => handleStatusToggle(u)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Page {meta.page} of {meta.totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1}
            onClick={() => fetchUsers(meta.page - 1)}
            className="p-2 rounded-md border border-slate-200 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => fetchUsers(meta.page + 1)}
            className="p-2 rounded-md border border-slate-200 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}