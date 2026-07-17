'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../contexts/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Award, Clock, FileText, TrendingUp } from 'lucide-react';

interface AnswerDetail {
  questionId: string;
  questionText: string;
  type: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  correctOption: string | null;
  openAnswer: string | null;
  score: number | null;
  feedback: string | null;
}

interface ResultData {
  attempt: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string;
    timeSpentSeconds: number;
  };
  scores: {
    mcqScore: number;
    openQuestionsScore: number;
    totalScore: number;
  };
  answers: AnswerDetail[];
}

export default function AssessmentResultsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultData | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchResults();
    }
  }, [isAuthenticated, isLoading]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/attempts/${attemptId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else if (response.status === 404) {
        toast.error('Results not found');
        router.push('/dashboard');
      } else {
        throw new Error('Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Results not available</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { scores, answers, attempt } = results;
  const mcqQuestions = answers.filter(a => a.type === 'MCQ');
  const openQuestions = answers.filter(a => a.type === 'OPEN');
  const correctMCQ = mcqQuestions.filter(a => a.isCorrect).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              scores.totalScore >= 70 ? 'bg-green-100 text-green-800' :
              scores.totalScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {scores.totalScore >= 70 ? '✅ Passed' :
               scores.totalScore >= 40 ? '⚠️ Needs Improvement' :
               '❌ Needs Improvement'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{scores.totalScore}%</p>
              <p className="text-sm text-gray-500">Overall Score</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{scores.mcqScore}%</p>
              <p className="text-sm text-gray-500">MCQ Score</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{scores.openQuestionsScore}%</p>
              <p className="text-sm text-gray-500">Open Questions Score</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900">{formatTime(attempt.timeSpentSeconds)}</p>
              </div>
              <p className="text-sm text-gray-500">Time Spent</p>
            </div>
          </div>

          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>Started: {new Date(attempt.startedAt).toLocaleString()}</span>
            <span>Completed: {new Date(attempt.completedAt).toLocaleString()}</span>
          </div>
        </div>

        {mcqQuestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Multiple Choice Questions ({correctMCQ}/{mcqQuestions.length} correct)
            </h2>
            <div className="space-y-4">
              {mcqQuestions.map((q, index) => (
                <div key={q.questionId} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start space-x-3">
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{index + 1}. {q.questionText}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your answer: <span className={q.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {q.selectedOption || 'Not answered'}
                        </span>
                      </p>
                      {!q.isCorrect && q.correctOption && (
                        <p className="text-sm text-green-600 mt-1">
                          Correct answer: {q.correctOption}
                        </p>
                      )}
                      {q.feedback && (
                        <p className="text-sm text-gray-500 mt-1">{q.feedback}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {openQuestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Open Questions ({openQuestions.filter(q => q.score && q.score > 0).length}/{openQuestions.length} answered)
            </h2>
            <div className="space-y-4">
              {openQuestions.map((q, index) => (
                <div key={q.questionId} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{index + 1}. {q.questionText}</p>
                      <p className="text-sm text-gray-600 mt-1">Your answer:</p>
                      <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
                        {q.openAnswer || 'Not answered'}
                      </p>
                      {q.score !== null && q.score !== undefined && (
                        <p className="text-sm font-medium text-purple-600 mt-2">
                          Score: {q.score}/10
                        </p>
                      )}
                      {q.feedback && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Feedback:</span> {q.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================
            TODO: AI Feedback (Future FastAPI Microservice)
            ============================================ */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">AI-Generated Feedback</h4>
              <p className="text-sm text-gray-600 mt-1">
                AI feedback will be available once reviewed by the recruiter.
                This feature will be implemented in the FastAPI microservice.
              </p>
              {/*
                Future FastAPI integration:
                GET /api/ai/feedback/{attemptId}
                Returns: { strengths: string[], weaknesses: string[], recommendations: string[] }
              */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}