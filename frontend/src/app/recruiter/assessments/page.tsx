'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';
import { Loader2, Plus, Users, Clock, BarChart3 } from 'lucide-react';

interface AssessmentSummary {
  id: string;
  title: string;
  theme: string;
  difficulty: string;
  durationMinutes: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  _count: { attempts: number };
}

export default function RecruiterAssessmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/assessments?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.data);
      } else {
        throw new Error('Failed to load assessments');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      ARCHIVED: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || styles.DRAFT;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <Button onClick={() => router.push('/recruiter/assessments/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No assessments yet. Create your first one to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {assessments.map((a) => (
            <Link
              key={a.id}
              href={`/recruiter/assessments/${a.id}`}
              className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{a.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(a.status)}`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {a.theme.replace('_', ' ')} · {a.difficulty} · {a.durationMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {a._count?.attempts ?? 0} attempts
                </div>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}