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
  Send,
  ClipboardCheck,
  MessageSquare,
  Inbox,
  ChevronRight,
  Shield,
  GraduationCap,
  Target,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

type StatusType = 'APPLIED' | 'SHORTLISTED' | 'TEST_INVITED' | 'TEST_COMPLETED' | 'ACCEPTED' | 'REJECTED';

// ─── SW Consulting Brand Colors ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_GOLD = '#c9a227';

interface DashboardData {
  status: {
    hasApplied: boolean;
    status: StatusType;
    submittedAt: string;
    updatedAt: string;
  };
  timeline: {
    hasApplied: boolean;
    timeline: Array<{
      key: string;
      label: string;
      completed: boolean;
      timestamp: string | null;
      notes: string | null;
    }>;
    currentStatus: StatusType;
  };
  actions: {
    actions: Array<{
      type: string;
      label: string;
      description: string;
      campaignId?: string;
      resultId?: string;
    }>;
    hasApplied: boolean;
  };
}

const statusConfig: Record<StatusType, { bg: string; text: string; border: string; label: string; icon: any }> = {
  APPLIED: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-700', 
    border: 'border-slate-200',
    label: 'Application Submitted',
    icon: Send
  },
  SHORTLISTED: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    label: 'Shortlisted',
    icon: Star
  },
  TEST_INVITED: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    label: 'Assessment Invited',
    icon: ClipboardCheck
  },
  TEST_COMPLETED: { 
    bg: 'bg-sky-50', 
    text: 'text-sky-700', 
    border: 'border-sky-200',
    label: 'Assessment Completed',
    icon: CheckCircle
  },
  ACCEPTED: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    label: 'Accepted',
    icon: Award
  },
  REJECTED: { 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200',
    label: 'Not Selected',
    icon: AlertCircle
  },
};

// Map timeline keys to Lucide icons
const timelineIconMap: Record<string, any> = {
  applied: Send,
  review: Users,
  shortlisted: Star,
  assessment_invited: ClipboardCheck,
  assessment_completed: CheckCircle,
  interview: MessageSquare,
  decision: Award,
  accepted: Award,
  rejected: AlertCircle,
};

// Map action types to Lucide icons
const actionIconMap: Record<string, any> = {
  take_assessment: ClipboardCheck,
  view_results: BarChart,
  view_application: FileText,
  default: ArrowRight,
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

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

  const handleAction = async (action: {
    type: string;
    label: string;
    description: string;
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: SW_BLUE }} />
          <p className="mt-4 text-sm text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasApplied) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(30, 58, 95, 0.08)' }}
            >
              <FileText className="w-10 h-10" style={{ color: SW_BLUE }} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Start Your Application
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              You haven't submitted an application yet. Take the first step towards your career with SW Consulting.
            </p>
            <Link href="/apply">
              <Button 
                className="px-8 h-11 text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: SW_BLUE }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE;
                }}
              >
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
  const actions = dashboardData?.actions?.actions || [];
  const timeline = dashboardData?.timeline?.timeline || [];
  const completedSteps = timeline.filter(t => t.completed).length;
  const totalSteps = timeline.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: SW_BLUE }}
            />
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          </div>
          <p className="text-slate-500 ml-4">
            Welcome back, <span className="font-medium text-slate-700">{user?.firstName}</span>. Here's your application status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Status and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Application Status</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusInfo.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Overall Progress</span>
                  <span className="text-sm font-bold" style={{ color: SW_BLUE }}>{progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${progressPercentage}%`,
                      backgroundColor: SW_BLUE
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{completedSteps}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Completed</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{totalSteps}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Steps</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-2xl font-bold" style={{ color: SW_BLUE }}>{progressPercentage}%</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Progress</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">
                    {dashboardData?.status?.submittedAt 
                      ? new Date(dashboardData.status.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Applied On</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Application Timeline</h2>
              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />
                
                <div className="space-y-6">
                  {timeline.map((item, index) => {
                    const IconComponent = timelineIconMap[item.key] || CheckCircle;
                    return (
                      <div key={index} className="relative pl-14">
                        <div 
                          className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            item.completed 
                              ? 'bg-white border-emerald-500' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <IconComponent 
                            className={`w-5 h-5 ${item.completed ? 'text-emerald-600' : 'text-slate-300'}`} 
                          />
                        </div>
                        
                        <div className={`p-4 rounded-xl border transition-all ${
                          item.completed 
                            ? 'border-slate-200 bg-white' 
                            : 'border-slate-100 bg-slate-50/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold text-sm ${
                              item.completed ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {item.label}
                            </h4>
                            {item.completed && (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                          {item.timestamp && (
                            <p className="text-xs text-slate-400 mt-1.5 font-medium">
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
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {actions.length > 0 ? (
                  actions.map((action, index) => {
                    const ActionIcon = actionIconMap[action.type] || actionIconMap.default;
                    return (
                      <button
                        key={index}
                        onClick={() => handleAction(action)}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group bg-white hover:shadow-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(30, 58, 95, 0.06)' }}
                          >
                            <ActionIcon className="w-5 h-5" style={{ color: SW_BLUE }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 group-hover:text-slate-700">
                              {action.label}
                            </h4>
                            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{action.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-500">No actions available</p>
                    <p className="text-sm mt-1">Your application is being processed</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">What to Expect</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Mail className="w-4 h-4" style={{ color: SW_BLUE }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Email Notifications</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">We'll keep you updated at every stage of the process</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <GraduationCap className="w-4 h-4" style={{ color: SW_BLUE }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Skills Assessment</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Prepare for role-specific technical evaluations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Target className="w-4 h-4" style={{ color: SW_BLUE }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Personalized Matching</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">We match your profile with the best opportunities</p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="rounded-2xl p-6 border"
              style={{ 
                backgroundColor: 'rgba(30, 58, 95, 0.03)',
                borderColor: 'rgba(30, 58, 95, 0.08)'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: SW_BLUE }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">Need Help?</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our recruitment team is here to assist you with any questions about your application.
              </p>
              <Button 
                variant="outline" 
                className="mt-4 text-sm w-full h-10 border-slate-200 hover:bg-white hover:border-slate-300 transition-all"
                onClick={() => toast.success('Support team will contact you soon!')}
              >
                <Mail className="w-4 h-4 mr-2" style={{ color: SW_BLUE }} />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}