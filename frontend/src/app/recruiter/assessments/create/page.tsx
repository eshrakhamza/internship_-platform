// app/recruiter/assessments/create/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import toast from 'react-hot-toast';
import {
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Plus,
  X,
  Save,
  Sparkles,
  Clock,
  Target,
  Award,
  BarChart3,
  GripVertical,
  Pencil,
  ChevronRight,
  AlertTriangle,
  Inbox,
  Settings2,
  ListChecks,
  Eye,
} from 'lucide-react';

// ─── SW Consulting Brand ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_GOLD = '#c9a227';

// ─── Types ───
type QType = 'MCQ' | 'OPEN';

interface DraftOption {
  optionText: string;
  isCorrect: boolean;
}

interface DraftQuestion {
  type: QType;
  questionText: string;
  explanation?: string;
  expectedAnswer?: string;
  options?: DraftOption[];
}

interface FormData {
  title: string;
  description: string;
  theme: string;
  difficulty: string;
  durationMinutes: number;
  mcqCount: number;
  openCount: number;
}

// ─── Constants ───
const THEMES = [
  { value: 'ARTIFICIAL_INTELLIGENCE', label: 'Artificial Intelligence' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'FULL_STACK', label: 'Full Stack' },
  { value: 'CLOUD_COMPUTING', label: 'Cloud Computing' },
  { value: 'SOFTWARE_ENGINEERING', label: 'Software Engineering' },
];

const DIFFICULTIES = [
  { value: 'BEGINNER', label: 'Beginner', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { value: 'INTERMEDIATE', label: 'Intermediate', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'ADVANCED', label: 'Advanced', color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

// ─── Sub-Components ───

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
              currentStep >= step
                ? 'text-white shadow-md'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
            style={currentStep >= step ? { backgroundColor: SW_BLUE } : {}}
          >
            {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          <div className="hidden sm:block">
            <p className={`text-xs font-semibold uppercase tracking-wider ${currentStep >= step ? 'text-slate-900' : 'text-slate-400'}`}>
              {step === 1 ? 'Configuration' : 'Review & Create'}
            </p>
          </div>
          {step === 1 && (
            <div className={`w-12 h-px ${currentStep > 1 ? 'bg-slate-300' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(30, 58, 95, 0.06)' }}
        >
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: SW_BLUE }} />
        </div>
        <p className="text-sm font-medium text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function QuestionTypeBadge({ type }: { type: QType }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        type === 'MCQ'
          ? 'bg-sky-50 text-sky-700 border-sky-200'
          : 'bg-violet-50 text-violet-700 border-violet-200'
      }`}
    >
      {type === 'MCQ' ? <ListChecks className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
      {type === 'MCQ' ? 'Multiple Choice' : 'Open Question'}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = DIFFICULTIES.find((d) => d.value === difficulty) || DIFFICULTIES[1];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───
export default function CreateAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    theme: THEMES[0].value,
    difficulty: 'INTERMEDIATE',
    durationMinutes: 60,
    mcqCount: 5,
    openCount: 2,
  });

  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    }),
    []
  );

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const generatePreview = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter an assessment title');
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
      setQuestions(data.questions || []);
      setStep(2);
      if (data.source === 'fallback') {
        toast('Using template questions — preview service unavailable', { icon: '⚠️' });
      } else {
        toast.success('Question preview ready');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate question preview');
    } finally {
      setGenerating(false);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, questionText: text } : q)));
  };

  const updateQuestionExplanation = (index: number, text: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, explanation: text } : q)));
  };

  const updateQuestionExpected = (index: number, text: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, expectedAnswer: text } : q)));
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || !q.options) return q;
        const newOpts = [...q.options];
        newOpts[oIndex] = { ...newOpts[oIndex], optionText: text };
        return { ...q, options: newOpts };
      })
    );
  };

  const toggleCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || !q.options) return q;
        const newOpts = q.options.map((opt, j) => ({
          ...opt,
          isCorrect: j === oIndex ? !opt.isCorrect : false,
        }));
        return { ...q, options: newOpts };
      })
    );
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || !q.options) return q;
        return { ...q, options: [...q.options, { optionText: 'New option', isCorrect: false }] };
      })
    );
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || !q.options) return q;
        return { ...q, options: q.options.filter((_, j) => j !== oIndex) };
      })
    );
  };

  const finalizeAssessment = async () => {
    if (questions.length === 0) {
      toast.error('Please keep at least one question');
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
          questions,
        }),
      });
      if (!res.ok) throw new Error('Failed to create assessment');
      const data = await res.json();
      toast.success('Assessment created successfully');
      router.push(`/recruiter/assessments/${data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  // ─── Step 1: Configuration ───
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Button
              variant="ghost"
              className="mb-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 -ml-2 h-9"
              onClick={() => router.push('/recruiter/assessments')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: SW_BLUE }} />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">New Assessment</h1>
            </div>
            <p className="text-slate-500 text-sm ml-4">Configure your evaluation and generate a question preview</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator currentStep={1} />

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8">
            {/* Section: Basic Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Basic Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Assessment Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="e.g. Full-Stack Internship Screening"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all resize-none"
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Brief overview of what this assessment evaluates..."
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Section: Configuration */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Configuration</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Theme</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all appearance-none"
                    value={form.theme}
                    onChange={(e) => updateForm('theme', e.target.value)}
                  >
                    {THEMES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Difficulty</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all appearance-none"
                    value={form.difficulty}
                    onChange={(e) => updateForm('difficulty', e.target.value)}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Section: Question Count */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Question Preview</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all"
                    value={form.durationMinutes}
                    onChange={(e) => updateForm('durationMinutes', Math.max(5, Math.min(180, Number(e.target.value))))}
                    min={5}
                    max={180}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Multiple Choice</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all"
                    value={form.mcqCount}
                    onChange={(e) => updateForm('mcqCount', Math.max(0, Math.min(15, Number(e.target.value))))}
                    min={0}
                    max={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Open Questions</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all"
                    value={form.openCount}
                    onChange={(e) => updateForm('openCount', Math.max(0, Math.min(10, Number(e.target.value))))}
                    min={0}
                    max={10}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                <span>We'll generate a preview of {form.mcqCount + form.openCount} questions based on your configuration. You can edit them in the next step.</span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4">
              <Button
                onClick={generatePreview}
                disabled={generating || !form.title.trim()}
                className="w-full h-12 text-white shadow-md hover:shadow-lg transition-all text-base font-semibold gap-2"
                style={{ backgroundColor: SW_BLUE, opacity: !form.title.trim() ? 0.5 : 1 }}
                onMouseEnter={(e) => {
                  if (form.title.trim()) (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE;
                }}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing question preview...
                  </>
                ) : (
                  <>
                    Preview Questions
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Review & Create ───
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            className="mb-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 -ml-2 h-9"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Configuration
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: SW_BLUE }} />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Review Questions</h1>
              </div>
              <p className="text-slate-500 text-sm ml-4">
                {questions.length} questions · {form.durationMinutes} min · {THEMES.find(t => t.value === form.theme)?.label} · <DifficultyBadge difficulty={form.difficulty} />
              </p>
            </div>
            <Button
              variant="outline"
              onClick={generatePreview}
              disabled={generating}
              className="h-10 border-slate-200 hover:bg-slate-50 gap-2 flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              Regenerate Preview
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StepIndicator currentStep={2} />

        {generating ? (
          <LoadingState message="Regenerating question preview..." />
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Questions Generated</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">The preview didn't return any questions. Try regenerating or go back to adjust your settings.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(1)} className="h-10">
                Adjust Settings
              </Button>
              <Button
                onClick={generatePreview}
                className="h-10 text-white gap-2"
                style={{ backgroundColor: SW_BLUE }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all"
                >
                  {/* Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: SW_BLUE }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <QuestionTypeBadge type={q.type} />
                            {q.type === 'MCQ' && (
                              <span className="text-xs text-slate-400 font-medium">{q.options?.length || 0} options</span>
                            )}
                          </div>
                          <textarea
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none resize-none transition-all"
                            value={q.questionText}
                            onChange={(e) => updateQuestionText(index, e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 pt-4 space-y-4">
                    {/* MCQ Options */}
                    {q.type === 'MCQ' && q.options && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Answer Options</p>
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              opt.isCorrect
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <button
                              onClick={() => toggleCorrectOption(index, oi)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              {opt.isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                            </button>
                            <input
                              className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none min-w-0"
                              value={opt.optionText}
                              onChange={(e) => updateOptionText(index, oi, e.target.value)}
                            />
                            <button
                              onClick={() => removeOption(index, oi)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Remove option"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(index)}
                          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 py-2 px-1 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Option
                        </button>
                      </div>
                    )}

                    {/* Expected Answer (Open) */}
                    {q.type === 'OPEN' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Grading Reference
                        </label>
                        <textarea
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none resize-none transition-all"
                          value={q.expectedAnswer || ''}
                          onChange={(e) => updateQuestionExpected(index, e.target.value)}
                          rows={3}
                          placeholder="What constitutes a good answer..."
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Explanation <span className="text-slate-300 font-normal">(shown to candidate after answering)</span>
                      </label>
                      <textarea
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none resize-none transition-all"
                        value={q.explanation || ''}
                        onChange={(e) => updateQuestionExplanation(index, e.target.value)}
                        rows={2}
                        placeholder="Why this is the correct answer..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Ready to Create?</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} · Saved as draft · You can publish later
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-11 border-slate-200 hover:bg-slate-50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={finalizeAssessment}
                    disabled={saving}
                    className="h-11 text-white shadow-md hover:shadow-lg transition-all gap-2 px-6"
                    style={{ backgroundColor: SW_BLUE }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Create Assessment
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100/50">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  This assessment will be created as a <strong>draft</strong>. You can review, edit, and publish it to candidates from the assessment detail page.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}