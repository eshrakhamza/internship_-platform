// app/recruiter/postings/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../../lib/api-client';
import { useAuthGuard } from '../../../../hooks/use-auth-guard';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  Edit3,
  Send,
  FileText,
  Globe,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

/* ───────── Types ───────── */

interface PostingDetail {
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
}

interface MatchResult {
  id: string;
  candidateId: string;
  similarityScore: number;
  explanation: string;
  rank: number;
  candidate: {
    id: string;
    fullName: string;
  };
}

interface MatchRun {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  results: MatchResult[];
}

const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700 ring-slate-600/20', icon: FileText },
  PUBLISHED: { label: 'Live', color: 'bg-green-50 text-green-700 ring-green-600/20', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', color: 'bg-amber-50 text-amber-700 ring-amber-600/20', icon: Archive },
};

const THEME_COLORS: Record<string, string> = {
  ARTIFICIAL_INTELLIGENCE: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  CYBERSECURITY: 'bg-red-50 text-red-700 ring-red-600/20',
  DEVOPS: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  DATA_SCIENCE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  FULL_STACK: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CLOUD_COMPUTING: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  SOFTWARE_ENGINEERING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

/* ───────── Component ───────── */

export default function RecruiterPostingDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuthGuard(['RECRUITER', 'ADMIN']);
  const router = useRouter();
  const params = useParams();
  const postingId = params.id as string;

  const [posting, setPosting] = useState<PostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [matchRun, setMatchRun] = useState<MatchRun | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'RECRUITER' && user?.role !== 'ADMIN') {
        toast.error('Access denied');
        router.push('/dashboard');
        return;
      }
      fetchPosting();
      fetchLatestMatch();
    }
  }, [isAuthenticated, isLoading, user, postingId]);

  const fetchPosting = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/postings/${postingId}`);
      setPosting(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Posting not found');
        router.push('/recruiter/postings');
      } else {
        toast.error('Failed to load posting');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestMatch = async () => {
    try {
      const res = await apiClient.get(`/jobs/${postingId}/latest-match`);
      if (res.data) setMatchRun(res.data);
    } catch {
      // no match run yet — normal for a posting that's never been matched
    }
  };

  const runMatching = async () => {
    setMatchLoading(true);
    try {
      const { data } = await apiClient.post(`/jobs/${postingId}/matches?limit=10`);
      let result: MatchRun;
      // Poll until the background match job finishes
      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await apiClient.get(`/match-runs/${data.matchRunId}`);
        result = poll.data;
        if (result.status === 'completed' || result.status === 'failed') break;
      }
      if (result.status === 'failed') {
        toast.error('Matching failed — check that candidates have processed CVs');
      } else {
        setMatchRun(result);
        toast.success(`Ranked ${result.results.length} candidate(s)`);
      }
    } catch {
      toast.error('Failed to run matching');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAction = async (action: 'publish' | 'archive' | 'delete') => {
    setActionLoading(action);
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        await apiClient.delete(`/postings/${postingId}`);
        toast.success('Posting deleted');
        router.push('/recruiter/postings');
        return;
      }

      await apiClient.post(`/postings/${postingId}/${action}`);
      toast.success(action === 'publish' ? 'Posting is now live' : 'Posting archived');
      fetchPosting();
    } catch {
      toast.error(`Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading posting…</p>
        </div>
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Posting not found</p>
          <Link href="/recruiter/postings">
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl">Back to Postings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[posting.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/recruiter/postings">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{posting.title}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${statusMeta.color}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Created {new Date(posting.createdAt).toLocaleDateString()} by {posting.creator.firstName}{' '}
                {posting.creator.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {posting.status === 'DRAFT' && (
              <>
                <Link href={`/recruiter/postings/${posting.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  onClick={() => handleAction('publish')}
                  disabled={actionLoading === 'publish'}
                >
                  {actionLoading === 'publish' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl border-slate-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                  onClick={() => handleAction('delete')}
                  disabled={actionLoading === 'delete'}
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </Button>
              </>
            )}
            {posting.status === 'PUBLISHED' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-slate-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200"
                onClick={() => handleAction('archive')}
                disabled={actionLoading === 'archive'}
              >
                {actionLoading === 'archive' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                Archive
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ─── Main Column ─── */}
          <div className="xl:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Description</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {posting.description}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Skills</h2>
              <div className="space-y-4">
                {posting.requiredSkills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Required
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {posting.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {posting.preferredSkills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Preferred
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {posting.preferredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Matched Candidates */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Matched Candidates
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Ranked by fit among {posting.theme.replace(/_/g, ' ')} candidates
                    {matchRun?.completedAt && (
                      <> · last run {new Date(matchRun.completedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={runMatching}
                  disabled={matchLoading}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shrink-0"
                >
                  {matchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : matchRun ? (
                    <RefreshCw className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {matchLoading ? 'Ranking…' : matchRun ? 'Re-run Matching' : 'Run Matching'}
                </Button>
              </div>

              <div className="divide-y divide-slate-100">
                {!matchRun || matchRun.results?.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No matches yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Click "Run Matching" to rank candidates for this posting.
                    </p>
                  </div>
                ) : (
                  matchRun.results.map((r) => (
                    <Link
                      key={r.id}
                      href={`/recruiter/applications/${r.candidateId}`}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                        #{r.rank}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {getInitials(r.candidate.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {r.candidate.fullName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.explanation}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 shrink-0">
                        {Math.round(r.similarityScore * 100)}%
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── Sidebar ─── */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Details</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Briefcase className="w-4 h-4" />
                    Theme
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${
                      THEME_COLORS[posting.theme] || 'bg-slate-50 text-slate-700 ring-slate-600/20'
                    }`}
                  >
                    {posting.theme.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {posting.isRemote ? 'Remote' : posting.location || 'On-site'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    Positions
                  </div>
                  <span className="text-sm font-medium text-slate-900">{posting.positions}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(posting.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    End Date
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(posting.endDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {posting.publishedAt && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Globe className="w-4 h-4" />
                      Published
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(posting.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Creator */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Created By</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                  {getInitials(`${posting.creator.firstName} ${posting.creator.lastName}`)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {posting.creator.firstName} {posting.creator.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{posting.creator.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}