'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Trash2, Plus, Send, CheckCircle, Save, X, Pencil } from 'lucide-react';

interface Option { id?: string; optionText: string; isCorrect: boolean; }
interface QuestionData {
  id: string;
  type: 'MCQ' | 'OPEN';
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questions: QuestionData[];
}
interface ResultRow {
  candidate: { id: string; name: string; email: string };
  status: string;
  mcqScore: number | null;
  openQuestionsScore: number | null;
  totalScore: number | null;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<QuestionData>>({});
  const [publishing, setPublishing] = useState(false);
  const [suggestions, setSuggestions] = useState<{ candidateId: string; name: string; email: string; score: number; summary: string; explanation: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

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
      const data = await res.json();
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
        setResults(data.attempts);
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
    setEditDraft({ questionText: q.questionText, explanation: q.explanation ?? '', expectedAnswer: q.expectedAnswer ?? '', options: q.options });
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
    if (!confirm('Delete this question?')) return;
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

  const addBlankQuestion = async (type: 'MCQ' | 'OPEN') => {
    const body =
      type === 'MCQ'
        ? {
            type: 'MCQ',
            questionText: 'New question — edit me',
            explanation: '',
            options: [
              { optionText: 'Option A', isCorrect: true },
              { optionText: 'Option B', isCorrect: false },
              { optionText: 'Option C', isCorrect: false },
              { optionText: 'Option D', isCorrect: false },
            ],
          }
        : { type: 'OPEN', questionText: 'New question — edit me', explanation: '', expectedAnswer: '' };

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
      toast.success('Assessment published');
      setShowPublishForm(false);
      fetchAssessment();
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;
  }
  if (!assessment) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Assessment not found</div>;
  }

  const isDraft = assessment.status === 'DRAFT';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="outline" className="mb-6" onClick={() => router.push('/recruiter/assessments')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{assessment.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isDraft ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
              }`}>
                {assessment.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {assessment.theme.replace('_', ' ')} · {assessment.difficulty} · {assessment.durationMinutes} min · {assessment.questions.length} questions
            </p>
          </div>
          {isDraft && (
            <Button onClick={() => { setShowPublishForm(!showPublishForm); if (!showPublishForm) fetchSuggestions(); }} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
        </div>

        {showPublishForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-3">
              AI-matched candidates for {assessment.theme.replace('_', ' ')}
            </p>

            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading matches...
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                No AI-analyzed candidates found for this theme yet. Candidates need an application review first.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.map((s) => (
                  <label
                    key={s.candidateId}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.includes(s.candidateId) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.candidateId)}
                      onChange={() => toggleCandidate(s.candidateId)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{s.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          s.score >= 70 ? 'bg-green-100 text-green-700' : s.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{s.email}</p>
                      <p className="text-xs text-gray-600 mt-1">{s.explanation}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <Button onClick={publish} disabled={publishing || selectedIds.length === 0} className="mt-3 bg-green-600 hover:bg-green-700">
              {publishing ? 'Publishing...' : `Publish to ${selectedIds.length} candidate${selectedIds.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        )}
      </div>

      {isDraft && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => addBlankQuestion('MCQ')}>
            <Plus className="w-4 h-4 mr-1" /> Add MCQ
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlankQuestion('OPEN')}>
            <Plus className="w-4 h-4 mr-1" /> Add Open Question
          </Button>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {assessment.questions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {q.type}
              </span>
              {isDraft && editingId !== q.id && (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(q)} className="text-gray-400 hover:text-blue-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {editingId === q.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full p-2 border rounded-lg text-sm font-medium"
                  value={editDraft.questionText}
                  onChange={(e) => setEditDraft({ ...editDraft, questionText: e.target.value })}
                  rows={2}
                />
                <textarea
                  className="w-full p-2 border rounded-lg text-sm"
                  value={editDraft.explanation ?? ''}
                  onChange={(e) => setEditDraft({ ...editDraft, explanation: e.target.value })}
                  rows={2}
                  placeholder="Explanation"
                />
                {q.type === 'OPEN' && (
                  <textarea
                    className="w-full p-2 border rounded-lg text-sm"
                    value={editDraft.expectedAnswer ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, expectedAnswer: e.target.value })}
                    rows={2}
                    placeholder="Expected answer (grading reference)"
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(q.id)}>
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm font-medium text-gray-900">{q.questionText}</p>
                {q.type === 'MCQ' && (
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`text-sm p-2 rounded flex items-center gap-2 ${
                        opt.isCorrect ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5" />}
                        {opt.optionText}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'OPEN' && q.expectedAnswer && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium">Grading reference:</span> {q.expectedAnswer}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {results && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Results ({results.length} candidates)</h2>
          {results.length === 0 ? (
            <p className="text-sm text-gray-500">No attempts yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Candidate</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">MCQ</th>
                  <th className="pb-2">Open</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.candidate.id} className="border-b last:border-0">
                    <td className="py-2">{r.candidate.name}<br /><span className="text-gray-400 text-xs">{r.candidate.email}</span></td>
                    <td className="py-2">{r.status}</td>
                    <td className="py-2">{r.mcqScore ?? '—'}%</td>
                    <td className="py-2">{r.openQuestionsScore ?? '—'}%</td>
                    <td className="py-2 font-medium">{r.totalScore ?? '—'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}