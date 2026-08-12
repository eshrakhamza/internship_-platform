'use client';

import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { adminService, DashboardStats } from '../../../services/admin-service';
import { Users, Briefcase, FileText, ClipboardList, UserCheck, UserX } from 'lucide-react';

const SW_BLUE = '#1e3a5f';
const SW_GOLD = '#c9a227';

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sublabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(30, 58, 95, 0.08)' }}
        >
          <Icon className="w-5 h-5" style={{ color: SW_BLUE }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-4">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { isLoading: authLoading } = useAuthGuard(['ADMIN']);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    adminService
      .getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, [authLoading]);

  if (authLoading || loading) {
    return <div className="max-w-7xl mx-auto px-6 py-10 text-slate-500">Loading dashboard…</div>;
  }

  if (error || !stats) {
    return <div className="max-w-7xl mx-auto px-6 py-10 text-red-600">{error ?? 'No data'}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">Platform-wide overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          icon={Users}
          label="Total users"
          value={stats.users.total}
          sublabel={`+${stats.users.recentSignups} in last 7 days`}
        />
        <StatCard icon={UserCheck} label="Active users" value={stats.users.active} />
        <StatCard icon={UserX} label="Inactive users" value={stats.users.inactive} />
        <StatCard
          icon={Briefcase}
          label="Postings"
          value={stats.postings.total}
          sublabel={`${stats.postings.published} published`}
        />
        <StatCard
          icon={FileText}
          label="Applications"
          value={stats.applications.total}
        />
        <StatCard
          icon={ClipboardList}
          label="Campaigns"
          value={stats.campaigns.total}
          sublabel={`${stats.campaigns.published} published`}
        />
        <StatCard
          icon={ClipboardList}
          label="Assessment attempts"
          value={stats.assessments.totalAttempts}
          sublabel={`${stats.assessments.completedAttempts} completed`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Users by role</h2>
          <div className="space-y-2">
            {Object.entries(stats.users.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{role.toLowerCase()}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Applications by status</h2>
          <div className="space-y-2">
            {Object.entries(stats.applications.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}