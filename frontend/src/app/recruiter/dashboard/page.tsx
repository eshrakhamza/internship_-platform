'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../contexts/auth-context';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import toast from 'react-hot-toast';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Loader2,
  FileText,
  Sparkles,
  BarChart3,
  Layers,
  Zap,
  Target,
  ChevronRight,
  Calendar,
  Mail,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

/* ───────── Types ───────── */

interface Stats {
  total: number;
  shortlisted: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number;
}

interface RecentApplication {
  id: string;
  status: string;
  submittedAt: string;
  candidate: {
    name: string;
    email: string;
  };
}

interface ThemeStats {
  theme: string;
  count: number;
}

interface DashboardData {
  stats: Stats;
  recentApplications: RecentApplication[];
  byTheme: ThemeStats[];
}

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  APPLIED: {
    label: 'Applied',
    color: 'bg-slate-100 text-slate-700 ring-slate-600/20',
    icon: FileText,
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: UserCheck,
  },
  TEST_INVITED: {
    label: 'Test Invited',
    color: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    icon: Zap,
  },
  TEST_COMPLETED: {
    label: 'Test Completed',
    color: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    icon: CheckCircle2,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-50 text-green-700 ring-green-600/20',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-700 ring-red-600/20',
    icon: XCircle,
  },
};

const THEME_COLORS: Record<string, string> = {
  ARTIFICIAL_INTELLIGENCE: 'bg-violet-500',
  CYBERSECURITY: 'bg-red-500',
  DEVOPS: 'bg-orange-500',
  DATA_SCIENCE: 'bg-emerald-500',
  FULL_STACK: 'bg-blue-500',
  CLOUD_COMPUTING: 'bg-sky-500',
  SOFTWARE_ENGINEERING: 'bg-indigo-500',
};

/* ───────── Component ───────── */

export default function RecruiterDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthGuard(['RECRUITER', 'ADMIN']);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'RECRUITER' && user?.role !== 'ADMIN') {
        toast.error('Access denied. Recruiters only.');
        router.push('/dashboard');
        return;
      }
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/applications/recruiter/stats');
      setData(response.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No data available</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push('/recruiter/applications')}>
            View Applications
          </Button>
        </div>
      </div>
    );
  }

  const { stats, recentApplications, byTheme } = data;
  const maxThemeCount = Math.max(...byTheme.map((t) => t.count), 1);

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      sub: 'All time',
      icon: Users,
      gradient: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview,
      sub: 'Need attention',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted,
      sub: 'Ready for tests',
      icon: UserCheck,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      sub: 'Hired',
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      sub: 'Closed',
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      text: 'text-red-700',
    },
    {
      label: 'Acceptance Rate',
      value: `${stats.acceptanceRate}%`,
      sub: 'Conversion',
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-1">Overview</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recruiter Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Welcome back, <span className="font-medium text-slate-700">{user?.firstName}</span>. Here's what's happening.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/recruiter/postings">
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Briefcase className="w-4 h-4" />
                Postings
              </Button>
            </Link>
            <Link href="/recruiter/applications">
              <Button className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{card.label}</p>
                <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ─── Recent Applications ─── */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Latest candidate submissions</p>
                </div>
                <Link href="/recruiter/applications">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                  >
                    See all
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {recentApplications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No applications yet</p>
                    <p className="text-sm text-slate-400 mt-1">Candidates will appear here once they apply.</p>
                  </div>
                ) : (
                  recentApplications.map((app) => {
                    const meta = STATUS_META[app.status] || STATUS_META.APPLIED;
                    const StatusIcon = meta.icon;
                    const initials = app.candidate.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <Link
                        key={app.id}
                        href={`/recruiter/applications/${app.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {app.candidate.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{app.candidate.email}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${meta.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:block">
                          {new Date(app.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── Postings Quick Access ─── */}
           
          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="space-y-6">
            {/* Theme Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Applications by Theme</h2>
              <p className="text-sm text-slate-500 mb-5">Breakdown of candidate interests</p>

              {byTheme.length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {byTheme.map((item) => {
                    const pct = Math.round((item.count / maxThemeCount) * 100);
                    const color = THEME_COLORS[item.theme] || 'bg-slate-500';
                    return (
                      <div key={item.theme}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            {item.theme?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2.5">
                <Link href="/recruiter/applications">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Review Applications</p>
                      <p className="text-xs text-slate-500">{stats.pendingReview} pending</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                  </button>
                </Link>
                <Link href="/recruiter/postings">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                      <Briefcase className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Manage Postings</p>
                      <p className="text-xs text-slate-500">Create or edit listings</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400" />
                  </button>
                </Link>
                <Link href="/recruiter/assessments">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Zap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Assessments</p>
                      <p className="text-xs text-slate-500">Tests & campaigns</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
                  </button>
                </Link>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                  </div>
                  <h3 className="font-bold text-lg">AI Insights</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Smart analytics coming soon. Match scores, skill gap analysis, and candidate ranking powered by your FastAPI microservice.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Top candidates by match score', status: 'Soon' },
                    { label: 'Skills gap analysis', status: 'Soon' },
                    { label: 'Automated screening', status: 'Soon' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-full text-slate-400 uppercase tracking-wider">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}