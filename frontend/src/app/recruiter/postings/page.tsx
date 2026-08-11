'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../contexts/auth-context';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Eye,
  Trash2,
  CheckCircle2,
  Archive,
  Loader2,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Wand2,
  X,
  ChevronDown,
  MoreHorizontal,
  Copy,
  RefreshCw,
  Save,
  Send,
  Bot,
  User,
  Clock,
  ArrowRight,
  FileText,
  Layers,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ───────── Types ───────── */

interface Posting {
  id: string;
  title: string;
  description: string;
  theme: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  positions: number;
  location: string | null;
  isRemote: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  publishedAt: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    applications: number;
  };
}

interface AIGeneratedDraft {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  modelUsed: string;
}

const THEMES = [
  'ARTIFICIAL_INTELLIGENCE',
  'CYBERSECURITY',
  'DEVOPS',
  'DATA_SCIENCE',
  'FULL_STACK',
  'CLOUD_COMPUTING',
  'SOFTWARE_ENGINEERING',
] as const;

const THEME_COLORS: Record<string, string> = {
  ARTIFICIAL_INTELLIGENCE: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  CYBERSECURITY: 'bg-red-50 text-red-700 ring-red-600/20',
  DEVOPS: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  DATA_SCIENCE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  FULL_STACK: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CLOUD_COMPUTING: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  SOFTWARE_ENGINEERING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

const STATUS_META = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-slate-100 text-slate-700 ring-slate-600/20',
    icon: FileText,
  },
  PUBLISHED: {
    label: 'Live',
    color: 'bg-green-50 text-green-700 ring-green-600/20',
    icon: CheckCircle2,
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    icon: Archive,
  },
};

/* ───────── Component ───────── */

export default function RecruiterPostingsPage() {
  const { user, isAuthenticated, isLoading } = useAuthGuard(['RECRUITER', 'ADMIN']);
  const router = useRouter();

  const [postings, setPostings] = useState<Posting[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', theme: '', search: '' });

  /* Modals */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIDraftModal, setShowAIDraftModal] = useState(false);
  const [activePosting, setActivePosting] = useState<Posting | null>(null);

  /* AI Draft State */
  const [aiForm, setAiForm] = useState({
    title: '',
    roughInput: '',
    seniority: 'internship',
    department: '',
  });
  const [aiDraft, setAiDraft] = useState<AIGeneratedDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  /* Create Form State */
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    theme: 'SOFTWARE_ENGINEERING',
    requiredSkills: '',
    preferredSkills: '',
    positions: 1,
    location: '',
    isRemote: false,
    startDate: '',
    endDate: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

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
      fetchPostings();
    }
  }, [isAuthenticated, isLoading, user, page, filters]);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.theme) params.append('theme', filters.theme);
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get(`/postings?${params}`);
      setPostings(response.data.data);
      setTotal(response.data.total);
    } catch {
      toast.error('Failed to load postings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!aiForm.title.trim() || !aiForm.roughInput.trim()) {
      toast.error('Please provide a title and rough notes');
      return;
    }
    setAiLoading(true);
    try {
      const res = await apiClient.post('/postings/generate-draft', aiForm);
      setAiDraft(res.data);
      toast.success(`Draft generated with ${res.data.modelUsed}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreatePosting = async (status: 'DRAFT' | 'PUBLISHED') => {
    setCreateLoading(true);
    try {
      const payload = {
        ...createForm,
        requiredSkills: createForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferredSkills: createForm.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        status,
      };
      await apiClient.post('/postings', payload);
      toast.success(status === 'PUBLISHED' ? 'Posting published!' : 'Draft saved');
      setShowCreateModal(false);
      resetForms();
      fetchPostings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save posting');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (id: string, action: 'publish' | 'archive' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        await apiClient.delete(`/postings/${id}`);
        toast.success('Posting deleted');
      } else {
        await apiClient.post(`/postings/${id}/${action}`);
        toast.success(action === 'publish' ? 'Posting is now live' : 'Posting archived');
      }
      fetchPostings();
    } catch {
      toast.error(`Failed to ${action}`);
    }
  };

  const applyAiDraftToForm = () => {
    if (!aiDraft) return;
    setCreateForm((prev) => ({
      ...prev,
      title: aiDraft.title,
      description: aiDraft.description,
      requiredSkills: aiDraft.requiredSkills.join(', '),
      preferredSkills: aiDraft.preferredSkills.join(', '),
    }));
    setShowAIDraftModal(false);
    setShowCreateModal(true);
    toast.success('Draft applied to form');
  };

  const resetForms = () => {
    setCreateForm({
      title: '',
      description: '',
      theme: 'SOFTWARE_ENGINEERING',
      requiredSkills: '',
      preferredSkills: '',
      positions: 1,
      location: '',
      isRemote: false,
      startDate: '',
      endDate: '',
    });
    setAiForm({ title: '', roughInput: '', seniority: 'internship', department: '' });
    setAiDraft(null);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading postings…</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Top Bar ─── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900 tracking-tight"></h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 border-dashed border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
              onClick={() => {
                resetForms();
                setShowAIDraftModal(true);
              }}
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Draft</span>
            </Button>
            <Button
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
              onClick={() => {
                resetForms();
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Posting
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── Stats ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Postings',
              value: total,
              icon: Layers,
              color: 'text-indigo-600 bg-indigo-50',
            },
            {
              label: 'Live Now',
              value: postings.filter((p) => p.status === 'PUBLISHED').length,
              icon: CheckCircle2,
              color: 'text-green-600 bg-green-50',
            },
            {
              label: 'Drafts',
              value: postings.filter((p) => p.status === 'DRAFT').length,
              icon: FileText,
              color: 'text-amber-600 bg-amber-50',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by title, theme, or location…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full sm:w-40 h-11 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Live</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filters.theme}
                onChange={(e) => setFilters({ ...filters, theme: e.target.value })}
                className="w-full sm:w-48 h-11 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
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
            {(filters.status || filters.theme || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11 px-3 text-slate-500 hover:text-slate-800"
                onClick={() => setFilters({ status: '', theme: '', search: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ─── Grid ─── */}
        {postings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No postings yet</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
              Create your first internship posting or let AI draft one from your rough notes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  resetForms();
                  setShowAIDraftModal(true);
                }}
              >
                <Sparkles className="w-4 h-4" />
                AI Draft
              </Button>
              <Button
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  resetForms();
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Create Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {postings.map((posting) => {
              const StatusIcon = STATUS_META[posting.status].icon;
              return (
                <div
                  key={posting.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                          THEME_COLORS[posting.theme] || 'bg-slate-50 text-slate-700 ring-slate-600/20'
                        }`}
                      >
                        {posting.theme.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                          STATUS_META[posting.status].color
                        }`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {STATUS_META[posting.status].label}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                      {posting.title}
                    </h3>

                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {posting.description}
                    </p>
                  </div>

                  {/* Skills */}
                  {(posting.requiredSkills?.length > 0 || posting.preferredSkills?.length > 0) && (
                    <div className="px-5 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {posting.requiredSkills?.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                        {posting.preferredSkills?.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                        {(posting.requiredSkills?.length || 0) + (posting.preferredSkills?.length || 0) > 6 && (
                          <span className="px-2 py-0.5 text-slate-400 text-xs font-medium">
                            +{(posting.requiredSkills?.length || 0) + (posting.preferredSkills?.length || 0) - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="px-5 py-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {posting.isRemote ? 'Remote' : posting.location || 'On-site'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(posting.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        {posting.positions} pos.
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {posting._count.applications} apps
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {posting.creator.firstName[0]}
                        {posting.creator.lastName[0]}
                      </div>
                      <span className="text-xs text-slate-500">
                        {posting.creator.firstName} {posting.creator.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/recruiter/postings/${posting.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {posting.status === 'DRAFT' && (
                        <>
                          <Link href={`/recruiter/postings/${posting.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-green-600"
                            onClick={() => handleStatusChange(posting.id, 'publish')}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            onClick={() => handleStatusChange(posting.id, 'delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {posting.status === 'PUBLISHED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                          onClick={() => handleStatusChange(posting.id, 'archive')}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{((page - 1) * limit) + 1}</span> to{' '}
              <span className="font-medium text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium text-slate-900">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════
          AI DRAFT MODAL
         ═══════════════════════════════════════════ */}
      {showAIDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Draft Generator</h2>
                  <p className="text-xs text-slate-500">Describe what you need — AI writes the posting</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIDraftModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!aiDraft ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Title</label>
                      <Input
                        value={aiForm.title}
                        onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })}
                        placeholder="e.g. Backend Developer Intern"
                        className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Seniority</label>
                        <select
                          value={aiForm.seniority}
                          onChange={(e) => setAiForm({ ...aiForm, seniority: e.target.value })}
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="internship">Internship</option>
                          <option value="junior">Junior</option>
                          <option value="mid">Mid-Level</option>
                          <option value="senior">Senior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                        <Input
                          value={aiForm.department}
                          onChange={(e) => setAiForm({ ...aiForm, department: e.target.value })}
                          placeholder="e.g. Engineering"
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Rough Notes <span className="text-slate-400 font-normal">— bullet points, loose ideas, anything</span>
                      </label>
                      <textarea
                        value={aiForm.roughInput}
                        onChange={(e) => setAiForm({ ...aiForm, roughInput: e.target.value })}
                        placeholder="Need someone who knows NestJS, Prisma, Postgres. Ideally Docker experience. Will work on our API layer..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold text-base"
                    onClick={handleGenerateAIDraft}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Crafting your posting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Draft
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-900 text-lg">{aiDraft.title}</h3>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded-md">
                        {aiDraft.modelUsed}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                      {aiDraft.description}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Required</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiDraft.requiredSkills.map((s) => (
                            <span key={s} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Preferred</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiDraft.preferredSkills.map((s) => (
                            <span key={s} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 gap-2 rounded-xl border-slate-200"
                      onClick={() => setAiDraft(null)}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </Button>
                    <Button
                      className="flex-1 h-11 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                      onClick={applyAiDraftToForm}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Edit & Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CREATE / EDIT MODAL
         ═══════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900">Create Posting</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Backend Developer Intern"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Theme</label>
                  <select
                    value={createForm.theme}
                    onChange={(e) => setCreateForm({ ...createForm, theme: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Positions</label>
                  <Input
                    type="number"
                    min={1}
                    value={createForm.positions}
                    onChange={(e) => setCreateForm({ ...createForm, positions: Number(e.target.value) })}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <Input
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    placeholder="Tunis, Tunisia"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-3 h-11">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createForm.isRemote}
                      onChange={(e) => setCreateForm({ ...createForm, isRemote: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Remote allowed
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date</label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Date</label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Full job description…"
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Required Skills <span className="text-slate-400 font-normal">comma separated</span>
                  </label>
                  <Input
                    value={createForm.requiredSkills}
                    onChange={(e) => setCreateForm({ ...createForm, requiredSkills: e.target.value })}
                    placeholder="NestJS, Prisma, PostgreSQL"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Preferred Skills <span className="text-slate-400 font-normal">comma separated</span>
                  </label>
                  <Input
                    value={createForm.preferredSkills}
                    onChange={(e) => setCreateForm({ ...createForm, preferredSkills: e.target.value })}
                    placeholder="Docker, Redis, GraphQL"
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 gap-2 rounded-xl border-slate-200 text-slate-700"
                  onClick={() => handleCreatePosting('DRAFT')}
                  disabled={createLoading}
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </Button>
                <Button
                  className="flex-1 h-11 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  onClick={() => handleCreatePosting('PUBLISHED')}
                  disabled={createLoading}
                >
                  <Send className="w-4 h-4" />
                  Publish Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}