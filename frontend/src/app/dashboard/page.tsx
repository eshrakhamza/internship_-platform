'use client';

import { useAuth } from '../../contexts/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { 
  User, Mail, LogOut, Home, FileText, Brain, TrendingUp, 
  Settings, Users, CheckCircle, Clock, XCircle, BarChart3,
  Sparkles, Medal, Calendar, ArrowUp, ArrowDown
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const isRecruiter = user.role === 'RECRUITER' || user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IP</span>
              </div>
              <span className="font-semibold text-gray-900">Internship Platform</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <a href="#" className="flex items-center space-x-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            
            {isRecruiter ? (
              <>
                <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Users className="w-5 h-5" />
                  <span>Candidates</span>
                </a>
                <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Assessments</span>
                </a>
                <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics</span>
                </a>
              </>
            ) : (
              <>
                <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>My Application</span>
                </a>
                <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Brain className="w-5 h-5" />
                  <span>Assessments</span>
                </a>
                <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Medal className="w-5 h-5" />
                  <span>Results</span>
                </a>
              </>
            )}
            
            <a href="#" className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isRecruiter ? 'Recruiter Dashboard' : 'Candidate Dashboard'}
              </h1>
              <p className="text-gray-500">Welcome back, {user.firstName}! 👋</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {isRecruiter ? (
              // Recruiter Stats
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                      <span className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUp className="w-3 h-3 mr-1" /> 12% this week
                      </span>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Shortlisted</p>
                      <p className="text-2xl font-bold text-gray-900">34</p>
                      <span className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUp className="w-3 h-3 mr-1" /> 5% this week
                      </span>
                    </div>
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pending Review</p>
                      <p className="text-2xl font-bold text-gray-900">23</p>
                      <span className="text-xs text-yellow-600 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" /> Needs attention
                      </span>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Acceptance Rate</p>
                      <p className="text-2xl font-bold text-gray-900">68%</p>
                      <span className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUp className="w-3 h-3 mr-1" /> 8% improvement
                      </span>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Candidate Stats
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Application Status</p>
                      <p className="text-2xl font-bold text-blue-600">APPLIED</p>
                      <span className="text-xs text-gray-500 mt-1">Submitted 3 days ago</span>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">AI Score</p>
                      <p className="text-2xl font-bold text-purple-600">85</p>
                      <span className="text-xs text-green-600 mt-1">Top 15%</span>
                    </div>
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Assessments</p>
                      <p className="text-2xl font-bold text-gray-900">2</p>
                      <span className="text-xs text-yellow-600 mt-1">1 pending, 1 completed</span>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Theme Match</p>
                      <p className="text-2xl font-bold text-green-600">92%</p>
                      <span className="text-xs text-green-600 mt-1">AI specialization</span>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Content Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity / Applications */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isRecruiter ? 'Recent Applications' : 'Application Timeline'}
              </h2>
              
              {isRecruiter ? (
                // Recruiter - Recent Applications List
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', email: 'john@example.com', status: 'Applied', theme: 'AI', date: '2 days ago' },
                    { name: 'Jane Smith', email: 'jane@example.com', status: 'Shortlisted', theme: 'Full Stack', date: '1 day ago' },
                    { name: 'Bob Wilson', email: 'bob@example.com', status: 'Reviewed', theme: 'Data Science', date: '3 hours ago' },
                  ].map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{app.name}</p>
                          <p className="text-sm text-gray-500">{app.theme} • {app.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          app.status === 'Shortlisted' ? 'bg-green-100 text-green-800' :
                          app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status}
                        </span>
                        <span className="text-sm text-gray-400">{app.date}</span>
                        <Button size="sm" variant="ghost">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Candidate - Timeline
                <div className="space-y-4">
                  {[
                    { status: 'Application Submitted', date: 'Jun 15, 2026', active: true },
                    { status: 'Shortlisted', date: 'Jun 18, 2026', active: true },
                    { status: 'Assessment Invited', date: 'Pending', active: false },
                    { status: 'Assessment Completed', date: 'Pending', active: false },
                    { status: 'Final Decision', date: 'Pending', active: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.active ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        <CheckCircle className={`w-4 h-4 ${item.active ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${item.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {item.status}
                        </p>
                        <p className="text-sm text-gray-500">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side Panel - AI Insights / Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isRecruiter ? '🤖 AI Insights' : '📊 Quick Stats'}
              </h2>

              {isRecruiter ? (
                // Recruiter - AI Insights
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Top Candidate</p>
                    <p className="text-lg font-bold text-gray-900">Jane Smith</p>
                    <p className="text-sm text-gray-500">AI Match: 95% • Score: 92</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">AI Recommendation</p>
                    <p className="text-sm text-gray-700">Shortlist 5 candidates for AI theme</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Needs Review</p>
                    <p className="text-sm text-gray-700">3 applications require your attention</p>
                  </div>
                </div>
              ) : (
                // Candidate - Quick Stats
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Application Status</p>
                    <p className="text-lg font-bold text-blue-600">Applied</p>
                    <p className="text-sm text-gray-500">Submitted: June 15, 2026</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">AI Recommendation</p>
                    <p className="text-sm text-gray-700">Strong fit for AI theme</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Next Step</p>
                    <p className="text-sm text-gray-700">Complete AI assessment test</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}