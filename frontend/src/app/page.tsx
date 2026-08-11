// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import {
  FileText,
  BarChart3,
  Users,
  ArrowRight,
  ChevronRight,
  Building2,
  Globe,
  Award,
  Shield,
  Briefcase,
  TrendingUp,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';

// ─── SW Consulting Brand ───
const SW_BLUE = '#1e3a5f';
const SW_BLUE_LIGHT = '#2c5282';
const SW_GOLD = '#c9a227';

// ─── Types ───
interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface Stat {
  label: string;
  value: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

// ─── Data ───
const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: 'Apply',
    description:
      'Submit your application in minutes. Our streamlined process ensures your profile reaches the right recruiters quickly.',
  },
  {
    icon: BarChart3,
    title: 'Assess',
    description:
      'Complete role-specific technical evaluations designed by industry experts to showcase your skills.',
  },
  {
    icon: Users,
    title: 'Track',
    description:
      'Follow your application journey in real-time with transparent status updates at every stage.',
  },
];

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Tell us about your background, skills, and career aspirations.',
  },
  {
    number: '02',
    title: 'Submit Application',
    description: 'Answer a few targeted questions tailored to your preferred role.',
  },
  {
    number: '03',
    title: 'Take Assessment',
    description: 'Complete a technical evaluation to demonstrate your expertise.',
  },
  {
    number: '04',
    title: 'Get Matched',
    description: 'Our team reviews your profile and connects you with the best opportunities.',
  },
];

const STATS: Stat[] = [
  { label: 'Consulting Partners', value: '150+' },
  { label: 'Placements', value: '2.5K+' },
  { label: 'Success Rate', value: '92%' },
];

// ─── Sub-Components ───

function Navbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl" style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'rgba(226,232,240,0.8)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: SW_BLUE }}>
              <span className="text-white font-bold text-sm tracking-tight">SW</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg tracking-tight leading-none">SW Consulting</span>
              <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase leading-none mt-0.5">Talent Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/login')}
              className="text-white shadow-md hover:shadow-lg transition-all px-6"
              style={{ backgroundColor: SW_BLUE }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ onCta }: { onCta: () => void }) {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border"
              style={{ backgroundColor: 'rgba(30,58,95,0.04)', color: SW_BLUE, borderColor: 'rgba(30,58,95,0.1)' }}
            >
              <Shield className="w-4 h-4" />
              <span>Trusted by Leading Consultancies</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
              Build Your Career with{' '}
              <span style={{ color: SW_BLUE }}>SW Consulting</span>
            </h1>

            <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-lg">
              Connect with top-tier consulting firms. We match exceptional talent with world-class internship opportunities across strategy, technology, and operations.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={onCta}
                className="text-white shadow-lg hover:shadow-xl transition-all px-8 h-12"
                style={{ backgroundColor: SW_BLUE }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE_LIGHT; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = SW_BLUE; }}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onCta}
                className="border-2 border-slate-200 hover:border-slate-400 hover:text-slate-900 px-8 h-12 text-slate-600"
              >
                Sign In
              </Button>
            </div>

            {/* Mini stats row */}
            <div className="mt-12 flex items-center gap-8">
              {STATS.map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Visual */}
          <div className="hidden lg:block relative">
            <div
              className="absolute -inset-4 rounded-3xl opacity-20 blur-3xl"
              style={{ backgroundColor: SW_BLUE }}
            />
            <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: SW_BLUE }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">SW Consulting</h3>
                  <p className="text-sm text-slate-400">Talent Acquisition Portal</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Briefcase, label: 'Strategy Consulting', count: '12 open roles' },
                  { icon: Globe, label: 'Technology Advisory', count: '8 open roles' },
                  { icon: TrendingUp, label: 'Operations', count: '5 open roles' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <item.icon className="w-4 h-4" style={{ color: SW_BLUE }} />
                      </div>
                      <span className="font-medium text-slate-700 text-sm">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Application deadline</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Rolling basis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px" style={{ backgroundColor: SW_GOLD }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: SW_GOLD }}>How It Works</span>
            <div className="w-8 h-px" style={{ backgroundColor: SW_GOLD }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Your Path to Success
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            A transparent, four-step process designed to identify and place top talent where they thrive.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
            >
              <div
                className="text-4xl font-bold mb-4 tracking-tighter"
                style={{ color: 'rgba(30,58,95,0.08)' }}
              >
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-200">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesCardsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'rgba(30,58,95,0.02)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10">
              From application to placement, our platform provides the tools and transparency you need to navigate your consulting career.
            </p>

            <div className="space-y-6">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(30,58,95,0.06)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: SW_BLUE }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual side */}
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-3xl opacity-10 blur-3xl"
              style={{ backgroundColor: SW_BLUE }}
            />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { icon: Award, label: 'Certified Programs', desc: 'Industry-recognized internships' },
                { icon: MapPin, label: 'Global Reach', desc: 'Opportunities worldwide' },
                { icon: Users, label: 'Expert Mentors', desc: 'Guidance from consultants' },
                { icon: Shield, label: 'Trusted Process', desc: 'Fair and transparent' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(30,58,95,0.06)' }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: SW_BLUE }} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{item.label}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onCta }: { onCta: () => void }) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden"
          style={{ backgroundColor: SW_BLUE }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-[0.03] rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to Start Your Journey?
            </h2>
            <p className="text-slate-300 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              Join the next generation of consulting professionals. Your future at SW Consulting begins with a single step.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                onClick={onCta}
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg px-8 h-12 font-semibold"
              >
                Get Started Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onCta}
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 h-12"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: SW_BLUE }}>
              <span className="text-white font-bold text-xs tracking-tight">SW</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm leading-none">SW Consulting</span>
              <span className="text-[10px] text-slate-400 leading-none mt-0.5">Talent Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-800 transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Contact
            </a>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 SW Consulting. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Component ───
export default function Home() {
  const router = useRouter();

  const handleCta = () => router.push('/login');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection onCta={handleCta} />
      <FeaturesSection />
      <FeaturesCardsSection />
      <CTASection onCta={handleCta} />
      <Footer />
    </div>
  );
}