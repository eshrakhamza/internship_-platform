// app/recruiter/assessments/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import toast from 'react-hot-toast';
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Plus,
  Send,
  CheckCircle,
  Save,
  X,
  Pencil,
  FileText,
  Clock,
  BarChart3,
  Users,
  ChevronRight,
  AlertTriangle,
  Inbox,
  Target,
  Award,
  CircleDot,
  GripVertical,
  Calendar,
  Shield,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── SW Consulting Brand ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_GOLD = '#c9a227';

// ─── Types ───
type QuestionType = 'MCQ' | 'OPEN';
type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface Option {
  id?: string;
  optionText: string;
  isCorrect: boolean;
}

interface QuestionData {
  id: string;
  type: QuestionType;
  questionText: string;
  explanation?: string | null;
  expectedAnswer?: string | null;
  options: Option[];
}

interface AssessmentData {
  id: string;
  title: string;
  description?: string;
  theme: string;
  difficulty: string;
  durationMinutes: number;
  status: AssessmentStatus;
  questions: QuestionData[];
}

interface CandidateResult {
  candidate: { id: string; name: string; email: string };
  status: string;
  mcqScore: number | null;
  openQuestionsScore: number | null;
  totalScore: number | null;
}

interface CandidateSuggestion {
  candidateId: string;
  name: string;
  email: string;
  score: number;
  summary: string;
  explanation: string;
}

// ─── Status Config ───
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

// ─── Sub-Components ───

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(30,58,95,0.06)' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: SW_BLUE }} />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading assessment...</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-300 font-medium">—</span>;
  let color = 'text-slate-600';
  let bg = 'bg-slate-100';
  if (score >= 80) { color = 'text-emerald-700'; bg = 'bg-emerald-50'; }
  else if (score >= 60) { color = 'text-sky-700'; bg = 'bg-sky-50'; }
  else if (score >= 40) { color = 'text-amber-700'; bg = 'bg-amber-50'; }
  else { color = 'text-red-700'; bg = 'bg-red-50'; }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${bg} ${color}`}>
      {score}%
    </span>
  );
}

function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const isMCQ = type === 'MCQ';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      isMCQ
        ? 'bg-sky-50 text-sky-700 border-sky-200'
        : 'bg-violet-50 text-violet-700 border-violet-200'
    }`}>
      {isMCQ ? <CircleDot className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
      {isMCQ ? 'Multiple Choice' : 'Open Question'}
    </span>
  );
}

// ─── Main Component ───
export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [results, setResults] = useState<CandidateResult[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<QuestionData>>({});
  const [publishing, setPublishing] = useState(false);
  const [suggestions, setSuggestions] = useState<CandidateSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  }), []);

  useEffect(() => { fetchAssessment(); }, [id]);

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}`, { headers: authHeaders() });
      if (res.status === 401) {
        toast.error('Session expired — please log in again');
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to load (${res.status}): ${body}`);
      }
      const data: AssessmentData = await res.json();
      setAssessment(data);
      if (data.status === 'PUBLISHED') fetchResults();
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}/results`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResults(data.attempts || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}/candidate-suggestions`, { headers: authHeaders() });
      if (res.ok) setSuggestions(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleCandidate = (candidateId: string) => {
    setSelectedIds((prev) =>
      prev.includes(candidateId) ? prev.filter((x) => x !== candidateId) : [...prev, candidateId],
    );
  };

  const startEdit = (q: QuestionData) => {
    setEditingId(q.id);
    setEditDraft({
      questionText: q.questionText,
      explanation: q.explanation ?? '',
      expectedAnswer: q.expectedAnswer ?? '',
      options: q.options,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };

  const saveEdit = async (questionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}/questions/${questionId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Question updated');
      cancelEdit();
      fetchAssessment();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update question');
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}/questions/${questionId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Question deleted');
      fetchAssessment();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete question');
    }
  };

  const addBlankQuestion = async (type: QuestionType) => {
    const body =
      type === 'MCQ'
        ? {
            type: 'MCQ',
            questionText: 'New multiple choice question',
            explanation: '',
            options: [
              { optionText: 'Option A', isCorrect: true },
              { optionText: 'Option B', isCorrect: false },
              { optionText: 'Option C', isCorrect: false },
              { optionText: 'Option D', isCorrect: false },
            ],
          }
        : { type: 'OPEN', questionText: 'New open-ended question', explanation: '', expectedAnswer: '' };

    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}/questions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Add failed');
      toast.success('Question added');
      fetchAssessment();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add question');
    }
  };

  const publish = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one candidate');
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments/${id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ candidateIds: selectedIds }),
      });
      if (!res.ok) throw new Error('Publish failed');
      toast.success(`Assessment published to ${selectedIds.length} candidate${selectedIds.length === 1 ? '' : 's'}`);
      setShowPublishPanel(false);
      fetchAssessment();
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Assessment Not Found"
          description="The assessment you're looking for doesn't exist or you don't have access to it."
        />
      </div>
    );
  }

  const isDraft = assessment.status === 'DRAFT';
  const statusCfg = STATUS_CONFIG[assessment.status];
  const filteredResults = results?.filter(r =>
    r.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            className="mb-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 -ml-2 h-9"
            onClick={() => router.push('/recruiter/assessments')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
                  {assessment.title}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-slate-500 text-sm flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  {assessment.theme.replace(/_/g, ' ')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  {assessment.difficulty}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {assessment.durationMinutes} min
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}
                </span>
              </p>
            </div>

            {isDraft && (
              <Button
                onClick={() => {
                  setShowPublishPanel(!showPublishPanel);
                  if (!showPublishPanel) fetchSuggestions();
                }}
                className="h-10 text-white shadow-md hover:shadow-lg transition-all flex-shrink-0"
                style={{ backgroundColor: SW_BLUE }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
              >
                <Send className="w-4 h-4 mr-2" />
                {showPublishPanel ? 'Close' : 'Publish Assessment'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Publish Panel */}
        {showPublishPanel && isDraft && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(30,58,95,0.06)' }}>
                  <Users className="w-5 h-5" style={{ color: SW_BLUE }} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Select Candidates</h3>
                  <p className="text-sm text-slate-500">Choose candidates to invite to this assessment</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingSuggestions ? (
                <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Finding matching candidates...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No Candidates Found"
                  description="There are no analyzed candidates matching this theme yet. Candidates need to submit an application first."
                />
              ) : (
                <>
                  <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-2">
                    {suggestions.map((s) => {
                      const isSelected = selectedIds.includes(s.candidateId);
                      return (
                        <div
                          key={s.candidateId}
                          onClick={() => toggleCandidate(s.candidateId)}
                          className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-slate-300 bg-slate-50 shadow-sm'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="pt-0.5">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-slate-700 bg-slate-700' : 'border-slate-300'
                            }`}>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                                <p className="text-xs text-slate-400">{s.email}</p>
                              </div>
                              <ScoreBadge score={s.score} />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{s.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-900">{selectedIds.length}</span> candidate{selectedIds.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowPublishPanel(false)} className="h-10">
                        Cancel
                      </Button>
                      <Button
                        onClick={publish}
                        disabled={publishing || selectedIds.length === 0}
                        className="h-10 text-white"
                        style={{ backgroundColor: SW_BLUE, opacity: selectedIds.length === 0 ? 0.5 : 1 }}
                        onMouseEnter={(e) => { if (selectedIds.length > 0) (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
                      >
                        {publishing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Publish to {selectedIds.length}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-200 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'questions'
                ? 'text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            style={activeTab === 'questions' ? { backgroundColor: SW_BLUE } : {}}
          >
            <FileText className="w-4 h-4" />
            Questions
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'questions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {assessment.questions.length}
            </span>
          </button>
          {assessment.status === 'PUBLISHED' && (
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'results'
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              style={activeTab === 'results' ? { backgroundColor: SW_BLUE } : {}}
            >
              <BarChart3 className="w-4 h-4" />
              Results
              {results && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'results' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {results.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {isDraft && (
              <div className="flex gap-3 mb-6">
                <Button
                  variant="outline"
                  onClick={() => addBlankQuestion('MCQ')}
                  className="h-10 border-slate-200 hover:border-slate-300 hover:bg-slate-50 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Multiple Choice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addBlankQuestion('OPEN')}
                  className="h-10 border-slate-200 hover:border-slate-300 hover:bg-slate-50 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Open Question
                </Button>
              </div>
            )}

            {assessment.questions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <EmptyState
                  icon={FileText}
                  title="No Questions Yet"
                  description="This assessment is empty. Add your first question to get started."
                />
              </div>
            ) : (
              assessment.questions.map((q, index) => {
                const isEditing = editingId === q.id;
                const isExpanded = expandedQuestion === q.id;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-slate-200"
                  >
                    {/* Question Header */}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                            style={{ backgroundColor: SW_BLUE }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <QuestionTypeBadge type={q.type} />
                              {q.type === 'MCQ' && (
                                <span className="text-xs text-slate-400 font-medium">
                                  {q.options.length} options
                                </span>
                              )}
                            </div>
                            {!isEditing ? (
                              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                                {q.questionText}
                              </p>
                            ) : (
                              <textarea
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none resize-none"
                                value={editDraft.questionText}
                                onChange={(e) => setEditDraft({ ...editDraft, questionText: e.target.value })}
                                rows={2}
                              />
                            )}
                          </div>
                        </div>

                        {isDraft && !isEditing && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEdit(q)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors sm:hidden"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Edit Mode */}
                      {isEditing && (
                        <div className="mt-4 space-y-3 pl-12">
                          <textarea
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none resize-none"
                            value={editDraft.explanation ?? ''}
                            onChange={(e) => setEditDraft({ ...editDraft, explanation: e.target.value })}
                            rows={2}
                            placeholder="Explanation (shown after answering)"
                          />
                          {q.type === 'OPEN' && (
                            <textarea
                              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none resize-none"
                              value={editDraft.expectedAnswer ?? ''}
                              onChange={(e) => setEditDraft({ ...editDraft, expectedAnswer: e.target.value })}
                              rows={3}
                              placeholder="Expected answer (grading reference)"
                            />
                          )}
                          {q.type === 'MCQ' && editDraft.options && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Options</p>
                              {editDraft.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                    opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                                  }`} onClick={() => {
                                    const newOpts = [...editDraft.options!];
                                    newOpts[i] = { ...newOpts[i], isCorrect: !newOpts[i].isCorrect };
                                    setEditDraft({ ...editDraft, options: newOpts });
                                  }}>
                                    {opt.isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                                  </div>
                                  <input
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
                                    value={opt.optionText}
                                    onChange={(e) => {
                                      const newOpts = [...editDraft.options!];
                                      newOpts[i] = { ...newOpts[i], optionText: e.target.value };
                                      setEditDraft({ ...editDraft, options: newOpts });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(q.id)}
                              className="h-9 text-white gap-1.5"
                              style={{ backgroundColor: SW_BLUE }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Changes
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="h-9 gap-1.5">
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* View Mode - Options / Expected Answer */}
                      {!isEditing && (
                        <div className={`mt-4 pl-12 ${isExpanded ? 'block' : 'hidden sm:block'}`}>
                          {q.type === 'MCQ' && q.options.length > 0 && (
                            <div className="space-y-1.5">
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                                    opt.isCorrect
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                      : 'bg-slate-50 text-slate-600 border border-transparent'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                                  }`}>
                                    {opt.isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="font-medium">{opt.optionText}</span>
                                  {opt.isCorrect && (
                                    <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'OPEN' && q.expectedAnswer && (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Grading Reference</p>
                              <p className="text-sm text-slate-600 leading-relaxed">{q.expectedAnswer}</p>
                            </div>
                          )}
                          {q.explanation && (
                            <div className="mt-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100/50">
                              <p className="text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Explanation</p>
                              <p className="text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
                />
              </div>
              <div className="text-sm text-slate-400 font-medium">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </div>
            </div>

            {results?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <EmptyState
                  icon={Inbox}
                  title="No Results Yet"
                  description="No candidates have completed this assessment. Results will appear here once submissions come in."
                />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                        <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">MCQ</th>
                        <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Open</th>
                        <th className="text-center py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredResults.map((r) => (
                        <tr key={r.candidate.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: SW_BLUE }}>
                                {r.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{r.candidate.name}</p>
                                <p className="text-xs text-slate-400">{r.candidate.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <ScoreBadge score={r.mcqScore} />
                          </td>
                          <td className="py-4 px-4 text-center">
                            <ScoreBadge score={r.openQuestionsScore} />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <ScoreBadge score={r.totalScore} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {filteredResults.map((r) => (
                    <div key={r.candidate.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: SW_BLUE }}>
                          {r.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{r.candidate.name}</p>
                          <p className="text-xs text-slate-400 truncate">{r.candidate.email}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          {r.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">MCQ</p>
                          <ScoreBadge score={r.mcqScore} />
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Open</p>
                          <ScoreBadge score={r.openQuestionsScore} />
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Total</p>
                          <ScoreBadge score={r.totalScore} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}