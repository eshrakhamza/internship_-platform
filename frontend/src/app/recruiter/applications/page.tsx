'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Star,
  FileText,
  Mail,
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Briefcase,
  MapPin,
  GraduationCap,
  Calendar,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ───────── Types ───────── */

interface Application {
  id: string;
  status: string;
  submittedAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    preferredTheme: string | null; // ← add
  };
  cvFile: { originalName: string } | null;
  aiScore: number | null;
}

interface ApplicationsResponse {
  data: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_META: Record<string, { label: string; color: string; icon: any; ring: string }> = {
  APPLIED: {
    label: 'Applied',
    color: 'bg-slate-50 text-slate-700',
    icon: FileText,
    ring: 'ring-slate-600/20',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: 'bg-emerald-50 text-emerald-700',
    icon: Star,
    ring: 'ring-emerald-600/20',
  },
  TEST_INVITED: {
    label: 'Test Invited',
    color: 'bg-violet-50 text-violet-700',
    icon: Briefcase,
    ring: 'ring-violet-600/20',
  },
  TEST_COMPLETED: {
    label: 'Test Completed',
    color: 'bg-indigo-50 text-indigo-700',
    icon: Calendar,
    ring: 'ring-indigo-600/20',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-50 text-green-700',
    icon: Star,
    ring: 'ring-green-600/20',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-700',
    icon: X,
    ring: 'ring-red-600/20',
  },
};

const THEMES = [
  'ARTIFICIAL_INTELLIGENCE',
  'CYBERSECURITY',
  'DEVOPS',
  'DATA_SCIENCE',
  'FULL_STACK',
  'CLOUD_COMPUTING',
  'SOFTWARE_ENGINEERING',
];

/* ───────── Component ───────── */

export default function RecruiterApplicationsPage() {
  const { user, isAuthenticated, isLoading } = useAuthGuard(['RECRUITER', 'ADMIN']);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationsResponse | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    theme: '',
    search: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

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
      fetchApplications();
    }
  }, [isAuthenticated, isLoading, user, filters]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        limit: String(filters.limit),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.theme) params.append('theme', filters.theme);
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get(`/applications/recruiter/applications?${params}`);
      setApplications(response.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const toggleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeFilterCount = [filters.status, filters.theme, filters.search].filter(Boolean).length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading applications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-1">Recruitment</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Applications</h1>
            <p className="text-slate-500 mt-1">
              {applications?.total ?? 0} candidate{applications?.total !== 1 ? 's' : ''} in the pipeline
            </p>
          </div>
          <Link href="/recruiter/dashboard">
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
            >
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email…"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Status */}
            <div className="relative lg:w-44">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full h-11 pl-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Theme */}
            <div className="relative lg:w-52">
              <select
                value={filters.theme}
                onChange={(e) => handleFilterChange('theme', e.target.value)}
                className="w-full h-11 pl-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
              >
                <option value="">All Themes</option>
                {THEMES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative lg:w-48">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full h-11 pl-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
              >
                <option value="submittedAt">Sort by Date</option>
                <option value="aiScore">Sort by AI Score</option>
                <option value="status">Sort by Status</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() =>
                  handleFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')
                }
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title={`Currently ${filters.sortOrder === 'desc' ? 'descending' : 'ascending'}`}
              >
                {filters.sortOrder === 'desc' ? (
                  <ArrowDown className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
              </button>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active filters bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</span>
              <div className="flex flex-wrap gap-2">
                {filters.status && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                    {STATUS_META[filters.status]?.label}
                    <button onClick={() => handleFilterChange('status', '')}>
                      <X className="w-3 h-3 hover:text-indigo-900" />
                    </button>
                  </span>
                )}
                {filters.theme && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold">
                    {filters.theme.replace(/_/g, ' ')}
                    <button onClick={() => handleFilterChange('theme', '')}>
                      <X className="w-3 h-3 hover:text-violet-900" />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    “{filters.search}”
                    <button onClick={() => handleFilterChange('search', '')}>
                      <X className="w-3 h-3 hover:text-slate-900" />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  setFilters({
                    page: 1,
                    limit: 10,
                    status: '',
                    theme: '',
                    search: '',
                    sortBy: 'submittedAt',
                    sortOrder: 'desc',
                  })
                }
                className="text-xs font-medium text-slate-400 hover:text-slate-600 ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ─── Table ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    AI Score
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications?.data.map((app) => {
                  const meta = STATUS_META[app.status] || STATUS_META.APPLIED;
                  const StatusIcon = meta.icon;

                  return (
                    <tr
                      key={app.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Candidate */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                            {getInitials(app.candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {app.candidate.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{app.candidate.email}</span>
                            </div>
                            {app.candidate.phoneNumber && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{app.candidate.phoneNumber}</span>
                              </div>
                            )}
                            {app.candidate.preferredTheme && (
  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold uppercase tracking-wide">
    {app.candidate.preferredTheme.replace(/_/g, ' ')}
  </span>
)}
                            
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ring-1 ring-inset ${meta.color} ${meta.ring}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(app.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* AI Score */}
                      <td className="px-6 py-4">
                        {app.aiScore ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  app.aiScore >= 80
                                    ? 'bg-emerald-500'
                                    : app.aiScore >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${app.aiScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{app.aiScore}%</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                            <Star className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Link href={`/recruiter/applications/${app.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {applications?.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">No applications found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Try adjusting your filters or search query.
                      </p>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="outline"
                          className="mt-4 rounded-xl border-slate-200"
                          onClick={() =>
                            setFilters({
                              page: 1,
                              limit: 10,
                              status: '',
                              theme: '',
                              search: '',
                              sortBy: 'submittedAt',
                              sortOrder: 'desc',
                            })
                          }
                        >
                          Clear Filters
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ─── */}
          {applications && applications.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {((applications.page - 1) * applications.limit) + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(applications.page * applications.limit, applications.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{applications.total}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={applications.page === 1}
                  onClick={() => handleFilterChange('page', String(applications.page - 1))}
                  className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: applications.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleFilterChange('page', String(p))}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      p === applications.page
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={applications.page === applications.totalPages}
                  onClick={() => handleFilterChange('page', String(applications.page + 1))}
                  className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}