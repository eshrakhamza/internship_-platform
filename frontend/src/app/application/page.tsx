// app/application/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Loader2, ArrowLeft, FileText, User, Mail, Phone, GraduationCap, Calendar, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApplicationData {
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
    school: string;
    academicLevel: string;
    graduationYear: number;
    preferredTheme: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    };
  };
}

export default function ApplicationPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchApplication();
    }
  }, [isAuthenticated, isLoading]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/applications/my-application`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      } else if (response.status === 404) {
        toast.error('No application found');
        router.push('/dashboard');
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">No Application Found</h2>
            <p className="text-gray-600 mt-2">You haven't submitted an application yet.</p>
            <Button className="mt-4" onClick={() => router.push('/apply')}>
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Application</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
              application.status === 'APPLIED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              application.status === 'SHORTLISTED' ? 'bg-green-100 text-green-800 border-green-200' :
              application.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {application.status.replace('_', ' ')}
            </span>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
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
              <div className="flex items-center text-gray-600">
                <GraduationCap className="w-4 h-4 mr-2" />
                {application.candidate.school}
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Graduating: {application.candidate.graduationYear}
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase className="w-4 h-4 mr-2" />
                Theme: {application.candidate.preferredTheme?.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Answers</h2>
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Submitted on: {new Date(application.submittedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}