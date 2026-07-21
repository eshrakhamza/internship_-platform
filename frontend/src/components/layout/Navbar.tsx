// components/layout/Navbar.tsx
'use client';

import { useAuth } from '../../contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  User,
  Briefcase,
  BarChart3,
  ClipboardList,
  Settings
} from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'ADMIN';
  const isCandidate = user?.role === 'CANDIDATE';

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link 
            href={isRecruiter ? "/recruiter/dashboard" : "/dashboard"} 
            className="text-xl font-bold text-blue-600"
          >
            Internship Platform
          </Link>
          
          <div className="flex items-center space-x-4">
            {isRecruiter ? (
              // Recruiter Navigation
              <>
                <Link 
                  href="/recruiter/dashboard" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/recruiter/applications" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Applications</span>
                </Link>
                <Link 
                  href="/recruiter/assessments" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Assessments</span>
                </Link>
                
<Link 
  href="/recruiter/postings" 
  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
>
  <Briefcase className="w-4 h-4" />
  <span>Postings</span>
</Link>
              </>
            ) : isCandidate ? (
              // Candidate Navigation
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/apply" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Apply</span>
                </Link>
                <Link 
  href="/assessments" 
  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
>
  <ClipboardList className="w-4 h-4" />
  <span>Assessments</span>
</Link>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-gray-400">({user?.role})</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}