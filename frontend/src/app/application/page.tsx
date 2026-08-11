// app/application/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import {
  Loader2,
  ArrowLeft,
  FileText,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Briefcase,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  BookOpen,
  ChevronRight,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── SW Consulting Brand ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_GOLD = '#c9a227';

// ─── Types ───
type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'TEST_INVITED' | 'TEST_COMPLETED' | 'ACCEPTED' | 'REJECTED';

interface CandidateUser {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

interface Candidate {
  school: string;
  academicLevel: string;
  graduationYear: number;
  preferredTheme: string;
  user: CandidateUser;
}

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  answerQuestion1: string;
  answerQuestion2: string;
  answerQuestion3: string;
  answerQuestion4: string;
  answerQuestion5: string;
  answerQuestion6: string;
  candidate: Candidate;
}

// ─── Status Configuration ───
interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ElementType;
  description: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  APPLIED: {
    label: 'Application Submitted',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Send,
    description: 'Your application has been received and is under review.',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
    description: 'Congratulations! You have been shortlisted for the next stage.',
  },
  TEST_INVITED: {
    label: 'Assessment Invited',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: FileText,
    description: 'You have been invited to complete a skills assessment.',
  },
  TEST_COMPLETED: {
    label: 'Assessment Completed',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: CheckCircle,
    description: 'Your assessment has been submitted and is being evaluated.',
  },
  ACCEPTED: {
    label: 'Accepted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
    description: 'Welcome to SW Consulting! We look forward to working with you.',
  },
  REJECTED: {
    label: 'Not Selected',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: XCircle,
    description: 'Thank you for your interest. We encourage you to apply again in the future.',
  },
};

// ─── Question Configuration ───
interface QuestionConfig {
  number: number;
  label: string;
  field: keyof Pick<
    ApplicationData,
    | 'answerQuestion1'
    | 'answerQuestion2'
    | 'answerQuestion3'
    | 'answerQuestion4'
    | 'answerQuestion5'
    | 'answerQuestion6'
  >;
}

const QUESTIONS: QuestionConfig[] = [
  { number: 1, label: 'Why are you interested in this internship program?', field: 'answerQuestion1' },
  { number: 2, label: 'Which internship theme interests you the most and why?', field: 'answerQuestion2' },
  { number: 3, label: 'What makes you a great fit for our team?', field: 'answerQuestion3' },
  { number: 4, label: 'Describe a concrete project you worked on recently', field: 'answerQuestion4' },
  { number: 5, label: 'Describe a difficult technical challenge you faced and how you solved it', field: 'answerQuestion5' },
  { number: 6, label: 'What technical skills do you want to improve during your internship?', field: 'answerQuestion6' },
];

// ─── Sub-Components ───

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" style={{ color: SW_BLUE }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </div>
  );
}

function QuestionCard({ number, label, answer }: { number: number; label: string; answer: string }) {
  return (
    <div className="group">
      <div className="flex items-start gap-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: SW_BLUE }}
        >
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm leading-relaxed">{label}</h4>
          <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{answer || 'No answer provided.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(30, 58, 95, 0.06)' }}
        >
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: SW_BLUE }} />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading your application...</p>
      </div>
    </div>
  );
}

function EmptyState({ onApply }: { onApply: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(30, 58, 95, 0.06)' }}
          >
            <FileText className="w-10 h-10" style={{ color: SW_BLUE }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Application Found</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
            You haven't submitted an application yet. Start your journey with SW Consulting today.
          </p>
          <Button
            className="px-8 h-11 text-white shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: SW_BLUE }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
            onClick={onApply}
          >
            Apply Now
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function ApplicationPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/applications/my-application`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ApplicationData = await response.json();
        if (data?.id && data?.candidate?.user) {
          setApplication(data);
        } else {
          throw new Error('Received invalid application data');
        }
      } else if (response.status === 404) {
        setApplication(null);
      } else if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch application');
      }
    } catch (err: any) {
      console.error('Error fetching application:', err);
      setError(err.message || 'Failed to load application');
      toast.error(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchApplication();
    }
  }, [isAuthenticated, authLoading, router, fetchApplication]);

  if (authLoading || loading) return <LoadingState />;

  if (error && !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={fetchApplication}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!application) return <EmptyState onApply={() => router.push('/apply')} />;

  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;
  const submittedDate = new Date(application.submittedAt);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          className="mb-6 text-slate-500 hover:text-slate-800 hover:bg-slate-100 -ml-2"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: SW_BLUE }}
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  My Application
                </h1>
              </div>
              <p className="text-slate-500 text-sm ml-4">
                Submitted on{' '}
                <span className="font-medium text-slate-700">
                  {submittedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>{' '}
                at{' '}
                <span className="font-medium text-slate-700">
                  {submittedDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>

          {/* Status Description */}
          <div 
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ 
              backgroundColor: 'rgba(30, 58, 95, 0.03)',
              borderColor: 'rgba(30, 58, 95, 0.08)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <StatusIcon className="w-4 h-4" style={{ color: SW_BLUE }} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Current Status</p>
              <p className="text-sm text-slate-500 mt-0.5">{statusConfig.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: SW_BLUE }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
              </div>

              <div className="space-y-3">
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={`${application.candidate.user.firstName} ${application.candidate.user.lastName}`}
                />
                <InfoRow
                  icon={Mail}
                  label="Email Address"
                  value={application.candidate.user.email}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone Number"
                  value={application.candidate.user.phoneNumber}
                />
                <InfoRow
                  icon={GraduationCap}
                  label="School / University"
                  value={application.candidate.school}
                />
                <InfoRow
                  icon={BookOpen}
                  label="Academic Level"
                  value={application.candidate.academicLevel}
                />
                <InfoRow
                  icon={Calendar}
                  label="Graduation Year"
                  value={application.candidate.graduationYear}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Preferred Theme"
                  value={application.candidate.preferredTheme?.replace(/_/g, ' ')}
                />
              </div>
            </div>

            {/* Help Card */}
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
                If you have questions about your application status, our recruitment team is here to help.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full h-10 border-slate-200 hover:bg-white hover:border-slate-300"
                onClick={() => toast.success('Support team will contact you soon!')}
              >
                <Mail className="w-4 h-4 mr-2" style={{ color: SW_BLUE }} />
                Contact Support
              </Button>
            </div>
          </div>

          {/* Right Column - Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: SW_BLUE }}
                >
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Your Responses</h2>
              </div>

              <div className="space-y-8">
                {QUESTIONS.map((q) => (
                  <QuestionCard
                    key={q.number}
                    number={q.number}
                    label={q.label}
                    answer={application[q.field]}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last updated: {submittedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="h-10 border-slate-200 hover:bg-slate-50"
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}