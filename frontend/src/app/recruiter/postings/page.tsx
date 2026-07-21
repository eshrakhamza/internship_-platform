'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Archive,
  Clock,
  Loader2,
  Briefcase,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import toast from 'react-hot-toast';

interface Posting {
  id: string;
  title: string;
  description: string;
  theme: string;
  status: string;
  positions: number;
  location: string | null;
  isRemote: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  publishedAt: string | null;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    applications: number;
  };
}

export default function RecruiterPostingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [postings, setPostings] = useState<Posting[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    theme: '',
    search: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const themes = ['ARTIFICIAL_INTELLIGENCE', 'CYBERSECURITY', 'DEVOPS', 'DATA_SCIENCE', 'FULL_STACK', 'CLOUD_COMPUTING', 'SOFTWARE_ENGINEERING'];
  const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

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
      fetchPostings();
    }
  }, [isAuthenticated, isLoading, user, page, filters]);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.theme) params.append('theme', filters.theme);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_URL}/api/postings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPostings(data.data);
        setTotal(data.total);
      } else {
        throw new Error('Failed to fetch postings');
      }
    } catch (error) {
      console.error('Error fetching postings:', error);
      toast.error('Failed to load postings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, action: 'publish' | 'archive' | 'delete') => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      let endpoint = '';
      let method = 'POST';
      let successMessage = '';

      switch (action) {
        case 'publish':
          endpoint = `${API_URL}/api/postings/${id}/publish`;
          successMessage = 'Posting published successfully!';
          break;
        case 'archive':
          endpoint = `${API_URL}/api/postings/${id}/archive`;
          successMessage = 'Posting archived successfully!';
          break;
        case 'delete':
          endpoint = `${API_URL}/api/postings/${id}`;
          method = 'DELETE';
          successMessage = 'Posting deleted successfully!';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(successMessage);
        fetchPostings();
      } else {
        throw new Error(`Failed to ${action} posting`);
      }
    } catch (error) {
      console.error(`Error ${action}ing posting:`, error);
      toast.error(`Failed to ${action} posting`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading postings...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Internship Postings</h1>
            <p className="text-gray-600 mt-1">Create and manage internship opportunities</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Posting
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search postings..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filters.theme}
              onChange={(e) => setFilters({ ...filters, theme: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Themes</option>
              {themes.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setFilters({ status: '', theme: '', search: '' })}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Postings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postings.map((posting) => (
            <div key={posting.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {posting.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(posting.status)}`}>
                    {posting.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {posting.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {posting.theme.replace('_', ' ')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {posting.isRemote ? 'Remote' : posting.location || 'On-site'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(posting.startDate).toLocaleDateString()} - {new Date(posting.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {posting.positions} position{posting.positions > 1 ? 's' : ''} • {posting._count.applications} applications
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Created by {posting.creator.firstName} {posting.creator.lastName}
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/recruiter/postings/${posting.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    {posting.status === 'DRAFT' && (
                      <>
                        <Link href={`/recruiter/postings/${posting.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(posting.id, 'publish')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {posting.status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(posting.id, 'archive')}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    {posting.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(posting.id, 'delete')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {postings.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No postings found</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              Create Your First Posting
            </Button>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Posting Modal - Simplified for now */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Posting</h2>
            <p className="text-gray-500 mb-4">This feature is coming soon. Please use the API directly.</p>
            <Button onClick={() => setShowCreateModal(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}