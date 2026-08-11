// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, CheckCircle, Building2, Loader2, Briefcase, Users, Globe } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const { sendOTP, login, user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Brand colors - SW Consulting
  const brandBlue = '#1e3a5f';
  const brandBlueLight = '#2c5282';
  const brandAccent = '#c9a227'; // Gold accent for consulting premium feel

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'RECRUITER' || user?.role === 'ADMIN') {
        router.push('/recruiter/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    try {
      await sendOTP(email);
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, otp);
      // Redirect is handled in the auth context
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: brandBlue }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              {/* SW Consulting Logo Mark */}
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: brandBlue }}
              >
                <span className="text-white font-bold text-2xl tracking-tight">SW</span>
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">
              Welcome to SW Consulting
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              {step === 'email' 
                ? 'Enter your email to access your account' 
                : 'Enter the verification code sent to your email'}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@sw-consulting.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-white shadow-md hover:shadow-lg transition-all duration-200"
                style={{ 
                  backgroundColor: brandBlue,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = brandBlueLight;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = brandBlue;
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Secure access portal for SW Consulting candidates and recruiters
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="otp"
                      type="text"
                      required
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="pl-10 h-12 text-center text-2xl tracking-widest font-mono border-slate-200 focus:border-slate-400 focus:ring-slate-400 bg-white"
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500 text-center">
                    Code sent to <span className="font-medium text-slate-700">{email}</span>
                  </p>
                </div>

                <div 
                  className="border rounded-lg p-4 flex items-start space-x-3"
                  style={{ 
                    backgroundColor: '#f1f5f9',
                    borderColor: '#e2e8f0'
                  }}
                >
                  <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: brandBlue }} />
                  <div className="text-sm text-slate-700">
                    <p>Check your inbox for the 6-digit verification code</p>
                    <p className="text-slate-400 text-xs mt-1">The code expires in 10 minutes</p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-white shadow-md hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: brandBlue }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = brandBlueLight;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = brandBlue;
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setStep('email')}
              >
                ← Change email address
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Brand Panel */}
      <div 
        className="hidden lg:flex flex-1 p-12 items-center justify-center"
        style={{ backgroundColor: brandBlue }}
      >
        <div className="max-w-md text-center text-white">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            {/* Large Logo */}
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span 
                className="font-bold text-3xl tracking-tight"
                style={{ color: brandBlue }}
              >
                SW
              </span>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">SW Consulting</h3>
            <div 
              className="w-12 h-0.5 mx-auto mb-4"
              style={{ backgroundColor: brandAccent }}
            />
            <p className="text-slate-300 mb-8 text-sm leading-relaxed">
              Connecting exceptional talent with world-class opportunities. 
              Your career journey starts here.
            </p>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-200">Premium job opportunities</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-200">Personalized career coaching</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-200">Global consulting network</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-400">
                © 2026 SW Consulting. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}