'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { Loader2, Clock, CheckCircle, ArrowRight, FileText } from 'lucide-react';

interface AvailableAssessment {
  id: string;
  title: string;
  theme: string;
  difficulty: string;
  durationMinutes: number;
  _count?: { questions: number };
}

interface CompletedAttempt {
  id: string;
  status: string;
  totalScore: number | null;
  completedAt: string;
  campaign: { id: string; title: string; theme: string };
}

export default function CandidateAssessmentsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<AvailableAssessment[]>([]);
  const [completed, setCompleted] = useState<CompletedAttempt[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchAll();
    }
  }, [isAuthenticated, isLoading]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [availRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/assessments/available`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/attempts/my/history`, { headers: authHeaders() }),
      ]);

      if (availRes.status === 401 || historyRes.status === 401) {
        toast.error('Session expired — please log in again');
        router.push('/login');
        return;
      }
      if (!availRes.ok || !historyRes.ok) {
        throw new Error(`Failed (${availRes.status}, ${historyRes.status})`);
      }

      setAvailable(await availRes.json());
      setCompleted(await historyRes.json());
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Assessments</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">To Complete</h2>
        {available.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            No assessments waiting for you right now.
          </div>
        ) : (
          <div className="space-y-3">
            {available.map((a) => (
              <Link
                key={a.id}
                href={`/assessment/${a.id}/take`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                    <span>{a.theme.replace('_', ' ')} · {a.difficulty}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {a.durationMinutes} min
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                  Start <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Completed</h2>
        {completed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            No completed assessments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((c) => (
              <Link
                key={c.id}
                href={`/assessment/results/${c.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">{c.campaign.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {c.campaign.theme.replace('_', ' ')} · Completed {new Date(c.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                    (c.totalScore ?? 0) >= 70 ? 'bg-green-100 text-green-700' :
                    (c.totalScore ?? 0) >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {c.totalScore ?? '—'}%
                  </span>
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}