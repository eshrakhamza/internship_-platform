'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../contexts/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Download,
  Eye,
  Award,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import toast from 'react-hot-toast';

interface StatusHistory {
  id: string;
  status: string;
  notes: string | null;
  changedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ApplicationDetail {
  id: string;
  status: string;
  submittedAt: string;
  answerQuestion1: string;
  answerQuestion2: string;
  answerQuestion3: string;
  answerQuestion4: string;
  answerQuestion5: string;
  answerQuestion6: string;
  candidate: {
    id: string;
    school: string | null;
    academicLevel: string | null;
    graduationYear: number | null;
    preferredTheme: string | null;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string | null;
    };
    cvFile: {
      originalName: string;
      filename: string;
    } | null;
    attempts: {
      id: string;
      status: string;
      totalScore: number | null;
      campaign: {
        title: string;
      };
    }[];
  };
  statusHistories: StatusHistory[];
  recruiterNotes: {
    id: string;
    content: string;
    category: string;
    createdAt: string;
    recruiter: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
  aiAnalysis: {
    candidateSummary: string;
    themeClassification: string;
    recommendationScore: number;
    recommendationExplanation: string;
  } | null;
}

export default function RecruiterApplicationDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statuses = ['APPLIED', 'SHORTLISTED', 'TEST_INVITED', 'TEST_COMPLETED', 'ACCEPTED', 'REJECTED'];

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'RECRUITER' && user?.role !== 'ADMIN') {
        toast.error('Access denied. Recruiters only.');
        router.push('/dashboard');
        return;
      }
      fetchApplication();
    }
  }, [isAuthenticated, isLoading, user]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/applications/recruiter/application/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      } else if (response.status === 404) {
        toast.error('Application not found');
        router.push('/recruiter/applications');
      } else {
        throw new Error('Failed to fetch application');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Status changed to ${newStatus}`,
        }),
      });

      if (response.ok) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchApplication();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/applications/recruiter/application/${applicationId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: noteContent,
        }),
      });

      if (response.ok) {
        toast.success('Note added successfully');
        setNoteContent('');
        fetchApplication();
      } else {
        throw new Error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
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
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Application not found</p>
          <Link href="/recruiter/applications">
            <Button className="mt-4">Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/recruiter/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
              {application.status.replace('_', ' ')}
            </span>
            <select
              value=""
              onChange={(e) => e.target.value && updateStatus(e.target.value)}
              disabled={updatingStatus}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Update Status</option>
              {statuses
                .filter(s => s !== application.status)
                .map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  {application.candidate.user.firstName} {application.candidate.user.lastName}
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {application.candidate.user.email}
                </div>
                {application.candidate.user.phoneNumber && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {application.candidate.user.phoneNumber}
                  </div>
                )}
                {application.candidate.school && (
                  <div className="flex items-center text-gray-600">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {application.candidate.school}
                  </div>
                )}
                {application.candidate.graduationYear && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Graduating: {application.candidate.graduationYear}
                  </div>
                )}
                {application.candidate.preferredTheme && (
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Theme: {application.candidate.preferredTheme.replace('_', ' ')}
                  </div>
                )}
                {application.candidate.cvFile && (
                  <div className="flex items-center text-blue-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <a
                      href={`/api/uploads/${application.candidate.cvFile.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {application.candidate.cvFile.originalName}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Application Answers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Answers</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">1. Why are you interested in this internship program?</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{application.answerQuestion1}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">2. Which internship theme interests you the most and why?</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{application.answerQuestion2}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">3. What makes you a great fit for our team?</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{application.answerQuestion3}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">4. Describe a concrete project you worked on recently</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{application.answerQuestion4}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">5. Describe a difficult technical challenge you faced and how you solved it</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{application.answerQuestion5}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">6. What technical skills do you want to improve during your internship?</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{application.answerQuestion6}</p>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-3">
                {application.statusHistories.map((history) => (
                  <div key={history.id} className="flex items-start space-x-3">
                    <div className="mt-1">
                      {history.status === 'REJECTED' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : history.status === 'ACCEPTED' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                          {history.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(history.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {history.notes && (
                        <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        by {history.user.firstName} {history.user.lastName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assessment Results */}
            {application.candidate.attempts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Results</h2>
                {application.candidate.attempts.map((attempt) => (
                  <div key={attempt.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="font-medium text-gray-900">{attempt.campaign.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        attempt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {attempt.status}
                      </span>
                      {attempt.totalScore !== null && (
                        <span className="text-sm font-medium text-gray-900">{attempt.totalScore}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================
                TODO: AI Analysis (FastAPI Integration)
                ============================================ */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Star className="w-5 h-5 text-blue-600 mr-2" />
                AI Analysis
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                AI analysis will be available once the FastAPI microservice is integrated.
              </p>
              <div className="mt-4 space-y-2">
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Match Score</p>
                  <p className="text-xs text-gray-400">Coming soon...</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Strengths</p>
                  <p className="text-xs text-gray-400">Coming soon...</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Areas for Improvement</p>
                  <p className="text-xs text-gray-400">Coming soon...</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-gray-400" />
                Notes
              </h2>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {application.recruiterNotes.length === 0 ? (
                  <p className="text-sm text-gray-500">No notes yet</p>
                ) : (
                  application.recruiterNotes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {note.recruiter.firstName} {note.recruiter.lastName} • {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1"
                  rows={2}
                />
                <Button onClick={addNote} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}