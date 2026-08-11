'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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

      const response = await fetch(`${API_URL}/api/assessments/candidate/${assessmentId}/take`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

        setTimeRemaining(data.durationMinutes * 60);
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

  useEffect(() => {
    if (timeRemaining > 0 && hasStarted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && hasStarted && assessment) {
      toast.error('Time is up! Auto-submitting...');
      handleSubmit();
    }
  }, [timeRemaining, hasStarted]);

  const startAssessment = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId: assessmentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAttemptId(data.id);
        setHasStarted(true);
        setTimeRemaining(assessment!.durationMinutes * 60);
        toast.success('Assessment started!');
      } else {
        throw new Error('Failed to start assessment');
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast.error('Failed to start assessment');
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
    saveAnswer(questionId, value);
  };

  const saveAnswer = async (questionId: string, value: any) => {
    if (!attemptId) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const payload: any = {
        questionId,
      };

      if (typeof value === 'string' && value.length > 100) {
        payload.openAnswer = value;
      } else {
        payload.selectedOptionId = value;
      }

      await fetch(`${API_URL}/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/attempts/${attemptId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
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
  };

  const handleNext = () => {
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

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
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{assessment.durationMinutes} minutes</p>
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
                <li>Make sure you have a stable internet connection</li>
                <li>You cannot pause the assessment once started</li>
                <li>Your answers are auto-saved</li>
                <li>Submit before the time runs out</li>
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

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isTimeLow = timeRemaining < 60;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${isTimeLow ? 'text-red-600' : 'text-gray-700'}`}>
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono text-lg font-bold">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </div>
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

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

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
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {answeredCount < assessment.questions.length &&
         currentQuestionIndex === assessment.questions.length - 1 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                You have {assessment.questions.length - answeredCount} unanswered questions
              </p>
              <p className="text-sm text-yellow-700">Please review all questions before submitting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}