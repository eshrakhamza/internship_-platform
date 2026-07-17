'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Mail,
  Loader2,
  FileText,
  Star,
  Calendar,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

interface Stats {
  total: number;
  shortlisted: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number;
}

interface RecentApplication {
  id: string;
  status: string;
  submittedAt: string;
  candidate: {
    name: string;
    email: string;
  };
}

interface ThemeStats {
  theme: string;
  count: number;
}

interface DashboardData {
  stats: Stats;
  recentApplications: RecentApplication[];
  byTheme: ThemeStats[];
}

export default function RecruiterDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      // Check if user is recruiter
      if (user?.role !== 'RECRUITER' && user?.role !== 'ADMIN') {
        toast.error('Access denied. Recruiters only.');
        router.push('/dashboard');
        return;
      }
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/applications/recruiter/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPLIED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-green-100 text-green-800',
      TEST_INVITED: 'bg-purple-100 text-purple-800',
      TEST_COMPLETED: 'bg-indigo-100 text-indigo-800',
      ACCEPTED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
          <Button className="mt-4" onClick={() => router.push('/recruiter/applications')}>
            View Applications
          </Button>
        </div>
      </div>
    );
  }

  const { stats, recentApplications, byTheme } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}! Here's your recruitment overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Acceptance Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.acceptanceRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
                <Link href="/recruiter/applications">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {recentApplications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No applications yet</p>
                ) : (
                  recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/recruiter/applications/${app.id}`}
                      className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{app.candidate.name}</p>
                          <p className="text-sm text-gray-500">{app.candidate.email}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Theme Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications by Theme</h2>
              <div className="space-y-3">
                {byTheme.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No data</p>
                ) : (
                  byTheme.map((item) => (
                    <div key={item.theme} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.theme?.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/recruiter/applications">
                  <Button className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View All Applications
                  </Button>
                </Link>
                <Link href="/recruiter/assessments">
                  <Button variant="outline" className="w-full">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Manage Assessments
                  </Button>
                </Link>
              </div>
            </div>

            {/* AI Insights Panel - Placeholder */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Star className="w-5 h-5 text-blue-600 mr-2" />
                AI Insights
              </h3>
              {/* ============================================
                  TODO: AI Insights (Future FastAPI Microservice)
                  ============================================ */}
              <p className="text-sm text-gray-600 mt-2">
                AI insights will be available once the FastAPI microservice is integrated.
              </p>
              <div className="mt-4 space-y-2">
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Top candidates by match score</p>
                  <p className="text-xs text-gray-400">Coming soon...</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Skills gap analysis</p>
                  <p className="text-xs text-gray-400">Coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}