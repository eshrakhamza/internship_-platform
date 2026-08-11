'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';

type QType = 'MCQ' | 'OPEN';

interface DraftQuestion {
  type: QType;
  questionText: string;
  explanation?: string;
  expectedAnswer?: string;
  options?: { optionText: string; isCorrect: boolean }[];
}

const THEMES = ['ARTIFICIAL_INTELLIGENCE', 'CYBERSECURITY', 'DEVOPS', 'DATA_SCIENCE', 'FULL_STACK', 'CLOUD_COMPUTING', 'SOFTWARE_ENGINEERING'];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    theme: THEMES[0],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 60,
    mcqCount: 5,
    openCount: 2,
  });

  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [source, setSource] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const generatePreview = async () => {
    if (!form.title.trim()) {
      toast.error('Give the assessment a title first');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments/preview-questions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          theme: form.theme,
          difficulty: form.difficulty,
          mcqCount: form.mcqCount,
          openCount: form.openCount,
        }),
      });
      if (!res.ok) throw new Error('Preview failed');
      const data = await res.json();
      setQuestions(data.questions);
      setSource(data.source);
      setStep('review');
      if (data.source === 'fallback') {
        toast('AI unavailable — showing template questions instead', { icon: '⚠️' });
      } else {
        toast.success(`Questions generated via ${data.source}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, questionText: text } : q)));
  };

  const finalizeAssessment = async () => {
    if (questions.length === 0) {
      toast.error('Keep at least one question');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          theme: form.theme,
          difficulty: form.difficulty,
          durationMinutes: form.durationMinutes,
          questions, // finalized — create() will use these directly, skipping AI
        }),
      });
      if (!res.ok) throw new Error('Failed to create assessment');
      const data = await res.json();
      toast.success('Assessment created as draft');
      router.push(`/recruiter/assessments/${data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'form') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" className="mb-6" onClick={() => router.push('/recruiter/assessments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h1 className="text-xl font-bold text-gray-900">New Assessment</h1>

          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Full-Stack Internship Screening"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <select
                className="w-full mt-1 p-3 border rounded-lg"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
              >
                {THEMES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Difficulty</label>
              <select
                className="w-full mt-1 p-3 border rounded-lg"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Duration (min)</label>
              <input
                type="number"
                className="w-full mt-1 p-3 border rounded-lg"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                min={5}
                max={180}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">MCQ count</label>
              <input
                type="number"
                className="w-full mt-1 p-3 border rounded-lg"
                value={form.mcqCount}
                onChange={(e) => setForm({ ...form, mcqCount: Number(e.target.value) })}
                min={0}
                max={15}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Open count</label>
              <input
                type="number"
                className="w-full mt-1 p-3 border rounded-lg"
                value={form.openCount}
                onChange={(e) => setForm({ ...form, openCount: Number(e.target.value) })}
                min={0}
                max={10}
              />
            </div>
          </div>

          <Button onClick={generatePreview} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating questions with AI...
              </>
            ) : (
              'Generate Questions'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="outline" className="mb-6" onClick={() => setStep('form')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to form
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Questions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {questions.length} questions · generated via {source}
          </p>
        </div>
        <Button variant="outline" onClick={generatePreview} disabled={generating}>
          <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          Regenerate All
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {q.type}
              </span>
              <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <textarea
              className="w-full mt-3 p-2 border rounded-lg text-sm font-medium text-gray-900"
              value={q.questionText}
              onChange={(e) => updateQuestionText(i, e.target.value)}
              rows={2}
            />

            {q.type === 'MCQ' && q.options && (
              <div className="mt-3 space-y-1">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`text-sm p-2 rounded flex items-center gap-2 ${
                    opt.isCorrect ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5" />}
                    {opt.optionText}
                  </div>
                ))}
              </div>
            )}

            {q.type === 'OPEN' && q.expectedAnswer && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Grading reference:</span> {q.expectedAnswer}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={finalizeAssessment} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
        {saving ? 'Saving...' : `Create Assessment (${questions.length} questions, as Draft)`}
      </Button>
    </div>
  );
}