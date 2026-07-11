'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Upload,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Briefcase,
  Lightbulb,
  Building2,
  Target,
  Code2,
  Brain,
  FileText
} from 'lucide-react';

export default function ApplyPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    school: '',
    academicLevel: '',
    graduationYear: '',
    preferredTheme: '',

    // Open Questions
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: '',
    question6: '',
  });

  const themes = [
    'ARTIFICIAL_INTELLIGENCE',
    'CYBERSECURITY',
    'DEVOPS',
    'DATA_SCIENCE',
    'FULL_STACK',
    'CLOUD_COMPUTING',
    'SOFTWARE_ENGINEERING',
  ];

  const academicLevels = [
    'Bachelor',
    'Masters',
    'PhD',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit application to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          school: formData.school,
          academicLevel: formData.academicLevel,
          graduationYear: parseInt(formData.graduationYear),
          preferredTheme: formData.preferredTheme,
          answerQuestion1: formData.question1,
          answerQuestion2: formData.question2,
          answerQuestion3: formData.question3,
          answerQuestion4: formData.question4,
          answerQuestion5: formData.question5,
          answerQuestion6: formData.question6,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      toast.success('Application submitted successfully! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Internship Application</h1>
          <p className="text-gray-600 mt-2">Complete your application to be considered for the internship program</p>
          <div className="mt-4 flex justify-center items-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s === step ? 'bg-blue-600 text-white' :
                  s < step ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-16 h-1 ${
                  s < step ? 'bg-green-500' : 'bg-gray-200'
                }`} />}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Step {step} of 3
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School / University *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Level *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="academicLevel"
                      value={formData.academicLevel}
                      onChange={handleChange}
                      className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select...</option>
                      {academicLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="graduationYear"
                      type="number"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="2026"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Theme *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="preferredTheme"
                      value={formData.preferredTheme}
                      onChange={handleChange}
                      className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a theme...</option>
                      {themes.map(theme => (
                        <option key={theme} value={theme}>
                          {theme.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="button" onClick={nextStep}>
                  Next Step
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Open Questions */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Open Questions</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1. What do you know about our company? *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="question1"
                      value={formData.question1}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    2. Which internship theme interests you the most and why? *
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="question2"
                      value={formData.question2}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3. What motivates you to join our company? *
                  </label>
                  <div className="relative">
                    <Lightbulb className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="question3"
                      value={formData.question3}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next Step
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: More Questions & Submit */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Final Questions</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    4. Describe a concrete project you worked on recently *
                  </label>
                  <div className="relative">
                    <Code2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="question4"
                      value={formData.question4}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Include: Problem Space, Solution, Your Contributions, Methodologies, Tools Used, Team Structure, Challenges, Outcomes, Lessons Learned</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    5. Describe a difficult technical challenge you faced and how you solved it *
                  </label>
                  <div className="relative">
                    <Brain className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="question5"
                      value={formData.question5}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    6. What technical skills do you want to improve during your internship? *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="question6"
                      value={formData.question6}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Previous
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                  <CheckCircle className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}