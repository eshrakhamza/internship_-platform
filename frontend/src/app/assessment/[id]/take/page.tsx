'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../../contexts/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, AlertCircle, Loader2, ChevronRight, ShieldAlert } from 'lucide-react';

interface Question {
  id: string;
  type: 'MCQ' | 'OPEN';
  questionText: string;
  explanation?: string;
  order: number;
  options?: {
    id: string;
    optionText: string;
    order: number;
  }[];
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  theme: string;
  difficulty: string;
  questions: Question[];
  attempts?: {
    id: string;
    status: string;
  }[];
}

// Per-question time budgets — tune here.
const MCQ_TIME_SECONDS = 90;   // 1.5 min per MCQ
const OPEN_TIME_SECONDS = 180; // 3 min per open question
const MAX_TAB_SWITCH_WARNINGS = 3;

export default function TakeAssessmentPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Per-question timer
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number>(0);

  // Anti-cheat: tab/window switch tracking
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchAssessment();
    }
  }, [isAuthenticated, isLoading]);

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/assessments/${assessmentId}/take`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        toast.error('Session expired — please log in again');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAssessment(data);

        if (data.attempts && data.attempts.length > 0) {
          const existingAttempt = data.attempts[0];
          setAttemptId(existingAttempt.id);

          if (existingAttempt.status === 'IN_PROGRESS') {
            setHasStarted(true);
            await loadAttemptAnswers(existingAttempt.id);
          } else if (existingAttempt.status === 'COMPLETED') {
            toast.success('You have already completed this assessment', {
              icon: 'ℹ️',
            });
            router.push(`/assessment/results/${existingAttempt.id}`);
            return;
          }
        }
      } else if (response.status === 404) {
        toast.error('Assessment not found');
        router.push('/dashboard');
      } else {
        const body = await response.text();
        throw new Error(`Failed to load assessment (${response.status}): ${body}`);
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const loadAttemptAnswers = async (attemptId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/attempts/${attemptId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const savedAnswers: Record<string, any> = {};
        data.answers?.forEach((a: any) => {
          if (a.selectedOptionId) {
            savedAnswers[a.questionId] = a.selectedOptionId;
          } else if (a.openAnswer) {
            savedAnswers[a.questionId] = a.openAnswer;
          }
        });
        setAnswers(savedAnswers);
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  const startAssessment = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: assessmentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setAttemptId(data.id);
        setHasStarted(true);
        toast.success('Assessment started!');
      } else {
        throw new Error('Failed to start assessment');
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast.error('Failed to start assessment');
    }
  };

  const currentQuestion = assessment?.questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
    if (currentQuestion) {
      saveAnswer(questionId, value, currentQuestion.type);
    }
  };

  const saveAnswer = async (questionId: string, value: any, questionType: 'MCQ' | 'OPEN') => {
    if (!attemptId) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const payload: any = { questionId };

      if (questionType === 'OPEN') {
        payload.openAnswer = value;
      } else {
        payload.selectedOptionId = value;
      }

      const res = await fetch(`${API_URL}/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Failed to save answer', res.status, await res.text());
        toast.error('Failed to save your answer — please retry this question');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save your answer — please retry this question');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/attempts/${attemptId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Assessment submitted successfully!');
        router.push(`/assessment/results/${attemptId}`);
      } else {
        throw new Error('Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, router]);

  // Forward-only advance: used both by the Next button and by a per-question timeout.
  const advanceQuestion = useCallback(() => {
    if (!assessment) return;

    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // Last question — finishing it (by click or timeout) submits the whole attempt.
      handleSubmit();
    }
  }, [assessment, currentQuestionIndex, handleSubmit]);

  // Reset the per-question timer whenever the question changes.
  useEffect(() => {
    if (!hasStarted || !currentQuestion) return;
    const budget = currentQuestion.type === 'OPEN' ? OPEN_TIME_SECONDS : MCQ_TIME_SECONDS;
    setQuestionTimeRemaining(budget);
  }, [hasStarted, currentQuestionIndex, currentQuestion?.type]);

  // Per-question countdown.
  useEffect(() => {
    if (!hasStarted || isSubmitting) return;
    if (questionTimeRemaining <= 0) {
      toast('Time\'s up for this question — moving on', { icon: '⏱️' });
      advanceQuestion();
      return;
    }
    const timer = setTimeout(() => setQuestionTimeRemaining((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [questionTimeRemaining, hasStarted, isSubmitting, advanceQuestion]);

  // Anti-cheat: tab switch / window blur detection.
  // IMPORTANT: this effect ONLY increments the counter — no toasts, no submit calls
  // inside the setState updater. Side effects live in the separate effect below,
  // which is the correct place for them.
  useEffect(() => {
    if (!hasStarted) return;

    const registerViolation = () => {
      if (hasAutoSubmittedRef.current || isSubmitting) return;
      setTabSwitchCount((count) => count + 1);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') registerViolation();
    };
    const onBlur = () => registerViolation();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [hasStarted, isSubmitting]);

  // React to tabSwitchCount changes here — this is where side effects
  // (toasts, auto-submit) belong, not inside the setState updater above.
  useEffect(() => {
    if (tabSwitchCount === 0 || hasAutoSubmittedRef.current) return;

    if (tabSwitchCount >= MAX_TAB_SWITCH_WARNINGS) {
      hasAutoSubmittedRef.current = true; // ensures this branch only ever runs once
      toast.error('Too many tab switches detected — assessment submitted automatically.');
      handleSubmit();
    } else {
      toast.error(
        `Tab switch detected (${tabSwitchCount}/${MAX_TAB_SWITCH_WARNINGS}) — please stay on this page.`,
      );
    }
  }, [tabSwitchCount, handleSubmit]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Assessment not found</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{assessment.title}</h1>
            <p className="text-gray-600 mb-6">{assessment.description || 'No description provided.'}</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Theme</p>
                  <p className="font-medium text-gray-900">{assessment.theme?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Difficulty</p>
                  <p className="font-medium text-gray-900">{assessment.difficulty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Per-question time</p>
                  <p className="font-medium text-gray-900">
                    ~{Math.round(MCQ_TIME_SECONDS / 60 * 10) / 10}min MCQ · ~{Math.round(OPEN_TIME_SECONDS / 60 * 10) / 10}min Open
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-medium text-gray-900">{assessment.questions.length} questions</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-6 text-left">
              <h4 className="font-medium text-yellow-800 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Before You Start
              </h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>Each question has its own timer — running out moves you to the next one</li>
                <li>You can't go back to a previous question once you've moved on</li>
                <li>Stay on this tab — switching away is flagged, and repeated switches auto-submit</li>
                <li>Your answers are auto-saved as you go</li>
              </ul>
            </div>

            <Button
              onClick={startAssessment}
              className="px-8 bg-green-600 hover:bg-green-700"
            >
              Start Assessment
              <Clock className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const qMinutes = Math.floor(questionTimeRemaining / 60);
  const qSeconds = questionTimeRemaining % 60;
  const isTimeLow = questionTimeRemaining < 20;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${isTimeLow ? 'text-red-600' : 'text-gray-700'}`}>
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono text-lg font-bold">
                  {String(qMinutes).padStart(2, '0')}:{String(qSeconds).padStart(2, '0')}
                </span>
                <span className="ml-2 text-xs text-gray-400">this question</span>
              </div>
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </div>
              {tabSwitchCount > 0 && (
                <div className="flex items-center text-xs text-red-600">
                  <ShieldAlert className="w-4 h-4 mr-1" />
                  {tabSwitchCount}/{MAX_TAB_SWITCH_WARNINGS} tab switches
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Answered: {answeredCount}/{assessment.questions.length}
              </span>
              <span className="text-sm font-medium text-green-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isTimeLow ? 'bg-red-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
              currentQuestion.type === 'MCQ'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {currentQuestion.type === 'MCQ' ? 'Multiple Choice' : 'Open Question'}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.questionText}
          </h3>

          {currentQuestion.type === 'MCQ' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'OPEN' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={6}
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your answer here..."
            />
          )}

          {currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-medium">💡 Hint:</span> {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="flex justify-end mt-8">
            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={advanceQuestion}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}