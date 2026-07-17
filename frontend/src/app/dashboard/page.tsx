// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Award,
  ArrowRight,
  Mail,
  User,
  Briefcase,
  TrendingUp,
  Star,
  BookOpen,
  Play,
  BarChart,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

type StatusType = 'APPLIED' | 'SHORTLISTED' | 'TEST_INVITED' | 'TEST_COMPLETED' | 'ACCEPTED' | 'REJECTED';

interface DashboardData {
  status: {
    hasApplied: boolean;
    status: StatusType;
    submittedAt: string;
    updatedAt: string;
    aiFeedback?: {
      score: number;
      summary: string;
    };
  };
  timeline: {
    hasApplied: boolean;
    timeline: Array<{
      key: string;
      label: string;
      icon: string;
      completed: boolean;
      timestamp: string | null;
      notes: string | null;
    }>;
    currentStatus: StatusType;
    aiFeedback: {
      summary: string;
      score: number;
      explanation: string;
      theme: string;
    } | null;
  };
  actions: {
    actions: Array<{
      type: string;
      label: string;
      description: string;
      icon: string;
      campaignId?: string;
      resultId?: string;
    }>;
    hasApplied: boolean;
  };
}

const statusColors: Record<StatusType, string> = {
  APPLIED: 'bg-blue-100 text-blue-800 border-blue-200',
  SHORTLISTED: 'bg-green-100 text-green-800 border-green-200',
  TEST_INVITED: 'bg-purple-100 text-purple-800 border-purple-200',
  TEST_COMPLETED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const statusEmojis: Record<StatusType, string> = {
  APPLIED: '📄',
  SHORTLISTED: '⭐',
  TEST_INVITED: '✉️',
  TEST_COMPLETED: '✅',
  ACCEPTED: '🎉',
  REJECTED: '❌',
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth(); // ← ADDED isLoading
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  // UPDATED: Wait for auth to load before checking
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/applications/dashboard');
      const data = response.data;
      setDashboardData(data);
      setHasApplied(data.status?.hasApplied || false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasApplied(false);
      } else {
        console.error('Error fetching dashboard:', error);
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

 // app/dashboard/page.tsx - In handleAction

const handleAction = async (action: {
  type: string;
  label: string;
  description: string;
  icon: string;
  campaignId?: string;
  resultId?: string;
}) => {
  switch (action.type) {
    case 'take_assessment':
      if (action.campaignId) {
        router.push(`/assessment/${action.campaignId}`);
      }
      break;
    case 'view_results':
      if (action.resultId) {
        router.push(`/assessment/results/${action.resultId}`);
      }
      break;
    case 'view_application':
      router.push('/application');
      break;
    default:
      toast.success('Feature coming soon!');
  }
};
  // ADDED: Loading state while auth is being checked
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasApplied) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Start Your Application
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't submitted an application yet. Take the first step towards your internship journey.
            </p>
            <Link href="/apply">
              <Button className="px-8">
                Apply Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = dashboardData?.status?.status || 'APPLIED';
  const aiFeedback = dashboardData?.timeline?.aiFeedback;
  const actions = dashboardData?.actions?.actions || [];
  const timeline = dashboardData?.timeline?.timeline || [];
  const completedSteps = timeline.filter(t => t.completed).length;
  const totalSteps = timeline.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Here's your application status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Status and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Application Status</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[status]}`}>
                  {statusEmojis[status]} {status.replace('_', ' ')}
                </span>
              </div>

              {aiFeedback && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">AI Application Analysis</h3>
                      <p className="text-sm text-gray-700 mt-1">{aiFeedback.summary}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">
                            Score: {aiFeedback.score}/100
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 text-blue-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            Theme: {aiFeedback.theme?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{completedSteps}</p>
                  <p className="text-xs text-gray-500">Completed Steps</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalSteps}</p>
                  <p className="text-xs text-gray-500">Total Steps</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
                  <p className="text-xs text-gray-500">Progress</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {dashboardData?.status?.submittedAt 
                      ? new Date(dashboardData.status.submittedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Applied On</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {timeline.map((item, index) => (
                    <div key={index} className="relative pl-12">
                      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      
                      <div className={`p-4 rounded-lg border ${
                        item.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${
                            item.completed ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {item.label}
                          </h4>
                          {item.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        {item.timestamp && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(item.timestamp).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {actions.length > 0 ? (
                  actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(action)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{action.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-700">
                            {action.label}
                          </h4>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No actions available</p>
                    <p className="text-sm">Your application is being processed</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Keep an eye on your email</p>
                    <p className="text-xs text-gray-500">We'll notify you about any updates</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-1 bg-purple-100 rounded-full">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Prepare for assessment</p>
                    <p className="text-xs text-gray-500">Review technical concepts</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-medium text-gray-900">Need Help?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Contact our recruitment team for assistance
              </p>
              <Button 
                variant="outline" 
                className="mt-3 text-sm w-full"
                onClick={() => toast.success('Support team will contact you soon!')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}