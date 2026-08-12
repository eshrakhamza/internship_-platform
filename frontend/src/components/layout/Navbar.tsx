// components/layout/Navbar.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Menu,
  X,
  ChevronDown,
  Bell,
  Sparkles,
} from 'lucide-react';

// ─── SW Consulting Brand Colors ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_BLUE_DARK = '#152a45';
const SW_GOLD = '#c9a227';

const NAV_LINKS = {
  RECRUITER: [
    { href: '/recruiter/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/recruiter/applications', label: 'Applications', icon: Users },
    { href: '/recruiter/assessments', label: 'Assessments', icon: ClipboardList },
    { href: '/recruiter/postings', label: 'Postings', icon: Briefcase },
  ],
  CANDIDATE: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/apply', label: 'Apply', icon: FileText },
    { href: '/assessment', label: 'Assessment', icon: ClipboardList },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/users', label: 'Users', icon: Users },
  ],
};

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) return null;



  const isAdmin = user?.role === 'ADMIN';
  const isRecruiter = user?.role === 'RECRUITER';
  const isCandidate = user?.role === 'CANDIDATE';
  const links = isAdmin ? NAV_LINKS.ADMIN : isRecruiter ? NAV_LINKS.RECRUITER : isCandidate ? NAV_LINKS.CANDIDATE : [];



  const getInitials = () => {
    const f = user?.firstName?.[0] || '';
    const l = user?.lastName?.[0] || '';
    return `${f}${l}`.toUpperCase() || 'U';
  };

  return (
    <>
      <nav 
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: 'rgba(226, 232, 240, 0.8)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ─── Logo ─── */}
            <div className="flex items-center gap-8">
              <Link
                href={isRecruiter ? '/recruiter/dashboard' : '/dashboard'}
                className="flex items-center gap-3 group"
              >
                {/* SW Logo Mark */}
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm transition-shadow group-hover:shadow-md"
                  style={{ backgroundColor: SW_BLUE }}
                >
                  <span className="text-white font-bold text-sm tracking-tight">SW</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                    SW Consulting
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase leading-none mt-0.5">
                    Talent Portal
                  </span>
                </div>
              </Link>

              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-1">
                {links.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        color: isActive ? SW_BLUE : '#64748b',
                        backgroundColor: isActive ? 'rgba(30, 58, 95, 0.08)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(30, 58, 95, 0.04)';
                          (e.currentTarget as HTMLElement).style.color = '#1e293b';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#64748b';
                        }
                      }}
                    >
                      <Icon 
                        className="w-4 h-4" 
                        style={{ color: isActive ? SW_BLUE : 'currentColor' }} 
                      />
                      {link.label}
                      {isActive && (
                        <span 
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                          style={{ backgroundColor: SW_BLUE }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ─── Right Side ─── */}
            <div className="hidden md:flex items-center gap-3">
              {/* Notification bell */}
              <button 
                className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(30, 58, 95, 0.04)';
                  (e.currentTarget as HTMLElement).style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                }}
              >
                <Bell className="w-[18px] h-[18px]" />
                <span 
                  className="absolute top-1.5 right-2 w-2 h-2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: SW_GOLD }}
                />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200" />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl transition-colors"
                  style={{ backgroundColor: profileOpen ? 'rgba(30, 58, 95, 0.04)' : 'transparent' }}
                  onMouseEnter={(e) => {
                    if (!profileOpen) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(30, 58, 95, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!profileOpen) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: SW_BLUE }}
                  >
                    {getInitials()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-slate-900 leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                      style={{ 
                        borderColor: 'rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 20px 25px -5px rgba(30, 58, 95, 0.08), 0 8px 10px -6px rgba(30, 58, 95, 0.04)'
                      }}
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors mt-1"
                        style={{ color: '#dc2626' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ─── Mobile Hamburger ─── */}
            <button
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Menu ─── */}
        {mobileOpen && (
          <div 
            className="md:hidden border-t animate-in slide-in-from-top-2 duration-200"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: 'rgba(226, 232, 240, 0.8)'
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      color: isActive ? SW_BLUE : '#475569',
                      backgroundColor: isActive ? 'rgba(30, 58, 95, 0.08)' : 'transparent',
                    }}
                  >
                    <Icon 
                      className="w-4 h-4" 
                      style={{ color: isActive ? SW_BLUE : '#94a3b8' }} 
                    />
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 my-2" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: '#dc2626' }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content doesn't hide under sticky nav */}
      <div className="h-4" />
    </>
  );
}