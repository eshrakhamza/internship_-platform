// app/recruiter/assessments/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';
import {
  Loader2,
  Plus,
  Users,
  Clock,
  BarChart3,
  ArrowRight,
  FileText,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Inbox,
  ChevronRight,
  Target,
  Award,
  MoreHorizontal,
  Trash2,
  Pencil,
  Archive,
} from 'lucide-react';

// ─── SW Consulting Brand ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_GOLD = '#c9a227';

// ─── Types ───
type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface AssessmentSummary {
  id: string;
  title: string;
  theme: string;
  difficulty: string;
  durationMinutes: number;
  status: AssessmentStatus;
  createdAt: string;
  _count: { attempts: number };
}

// ─── Status Configuration ───
const STATUS_CONFIG: Record<AssessmentStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  PUBLISHED: {
    label: 'Published',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
};

// ─── Difficulty Config ───
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Beginner', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  INTERMEDIATE: { label: 'Intermediate', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ADVANCED: { label: 'Advanced', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  EXPERT: { label: 'Expert', color: 'text-violet-600 bg-violet-50 border-violet-200' },
};

// ─── Sub-Components ───

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(30, 58, 95, 0.06)' }}
        >
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: SW_BLUE }} />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading assessments...</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mx-auto leading-relaxed mb-8">{description}</p>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.INTERMEDIATE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───
export default function RecruiterAssessmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'ALL'>('ALL');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    }),
    []
  );

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments?limit=50`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.data || []);
      } else if (res.status === 401) {
        toast.error('Session expired. Please log in again.');
        router.push('/login');
      } else {
        throw new Error('Failed to load assessments');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.theme.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assessments.length,
    draft: assessments.filter((a) => a.status === 'DRAFT').length,
    published: assessments.filter((a) => a.status === 'PUBLISHED').length,
    archived: assessments.filter((a) => a.status === 'ARCHIVED').length,
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: SW_BLUE }}
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Assessments
                </h1>
              </div>
              <p className="text-slate-500 text-sm ml-4">
                Manage and publish technical evaluations for your candidates
              </p>
            </div>
            <Button
              onClick={() => router.push('/recruiter/assessments/create')}
              className="h-10 text-white shadow-md hover:shadow-lg transition-all flex-shrink-0 gap-2"
              style={{ backgroundColor: SW_BLUE }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE;
              }}
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: FileText, color: SW_BLUE },
            { label: 'Drafts', value: stats.draft, icon: Pencil, color: '#64748b' },
            { label: 'Published', value: stats.published, icon: Award, color: '#059669' },
            { label: 'Archived', value: stats.archived, icon: Archive, color: '#d97706' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (stat.label === 'Total') setStatusFilter('ALL');
                else if (stat.label === 'Drafts') setStatusFilter('DRAFT');
                else if (stat.label === 'Published') setStatusFilter('PUBLISHED');
                else if (stat.label === 'Archived') setStatusFilter('ARCHIVED');
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
            {(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
                }`}
                style={
                  statusFilter === status
                    ? { backgroundColor: SW_BLUE }
                    : {}
                }
              >
                {status === 'ALL' ? 'All' : STATUS_CONFIG[status].label}
                <span
                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {status === 'ALL'
                    ? assessments.length
                    : assessments.filter((a) => a.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {assessments.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No Assessments Yet"
            description="Create your first assessment to start evaluating candidates. You can add multiple-choice and open-ended questions."
            action={
              <Button
                onClick={() => router.push('/recruiter/assessments/create')}
                className="h-10 text-white gap-2"
                style={{ backgroundColor: SW_BLUE }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE;
                }}
              >
                <Plus className="w-4 h-4" />
                Create First Assessment
              </Button>
            }
          />
        ) : filteredAssessments.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Results Found"
            description="No assessments match your current filters. Try adjusting your search or filter criteria."
          />
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map((a) => (
              <Link
                key={a.id}
                href={`/recruiter/assessments/${a.id}`}
                className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-slate-700 transition-colors">
                        {a.title}
                      </h3>
                      <StatusBadge status={a.status} />
                      <DifficultyBadge difficulty={a.difficulty} />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        {a.theme.replace(/_/g, ' ')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {a.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(a.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Stats + Action */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <Users className="w-4 h-4 text-slate-400" />
                          {a._count?.attempts ?? 0}
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          Attempts
                        </p>
                      </div>
                      <div className="w-px h-8 bg-slate-100" />
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <BarChart3 className="w-4 h-4 text-slate-400" />
                          {a._count?.attempts > 0 ? 'Active' : '—'}
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          Status
                        </p>
                      </div>
                    </div>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{ backgroundColor: 'rgba(30, 58, 95, 0.06)' }}
                    >
                      <ChevronRight className="w-5 h-5" style={{ color: SW_BLUE }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}