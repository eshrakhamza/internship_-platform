'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Star,
  FileText,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import toast from 'react-hot-toast';

interface Application {
  id: string;
  status: string;
  submittedAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  cvFile: {
    originalName: string;
  } | null;
  aiScore: number | null;
}

interface ApplicationsResponse {
  data: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RecruiterApplicationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationsResponse | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    theme: '',
    search: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const statuses = ['APPLIED', 'SHORTLISTED', 'TEST_INVITED', 'TEST_COMPLETED', 'ACCEPTED', 'REJECTED'];
  const themes = ['ARTIFICIAL_INTELLIGENCE', 'CYBERSECURITY', 'DEVOPS', 'DATA_SCIENCE', 'FULL_STACK', 'CLOUD_COMPUTING', 'SOFTWARE_ENGINEERING'];

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
      fetchApplications();
    }
  }, [isAuthenticated, isLoading, user, filters]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const params = new URLSearchParams({
        page: String(filters.page),
        limit: String(filters.limit),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.theme) params.append('theme', filters.theme);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_URL}/api/applications/recruiter/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
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

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-1">Manage and review candidate applications</p>
          </div>
          <Link href="/recruiter/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search candidates..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={filters.theme}
              onChange={(e) => handleFilterChange('theme', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Themes</option>
              {themes.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="submittedAt">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {/* AI Score - Coming soon */}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications?.data.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{app.candidate.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{app.candidate.email}</span>
                        </div>
                        {app.candidate.phoneNumber && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{app.candidate.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {/* Theme will be available in the full response */}
                      -
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {/* ============================================
                          TODO: AI Match Score (FastAPI Integration)
                          ============================================ */}
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-gray-300" />
                        <span className="ml-1 text-sm text-gray-400">-</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/recruiter/applications/${app.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {applications?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {applications && applications.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((applications.page - 1) * applications.limit) + 1} to{' '}
                {Math.min(applications.page * applications.limit, applications.total)} of {applications.total} results
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={applications.page === 1}
                  onClick={() => handlePageChange(applications.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={applications.page === applications.totalPages}
                  onClick={() => handlePageChange(applications.page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}