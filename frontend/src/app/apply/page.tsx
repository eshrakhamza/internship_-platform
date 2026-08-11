// app/apply/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
  FileText,
  File,
  X,
  AlertCircle
} from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  school: string;
  academicLevel: string;
  graduationYear: string;
  preferredTheme: string;
  answerQuestion1: string;
  answerQuestion2: string;
  answerQuestion3: string;
  answerQuestion4: string;
  answerQuestion5: string;
  answerQuestion6: string;
}

export default function ApplyPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    school: '',
    academicLevel: '',
    graduationYear: '',
    preferredTheme: '',
    answerQuestion1: '',
    answerQuestion2: '',
    answerQuestion3: '',
    answerQuestion4: '',
    answerQuestion5: '',
    answerQuestion6: '',
  });

  const themes = [
    { value: 'ARTIFICIAL_INTELLIGENCE', label: 'Artificial Intelligence' },
    { value: 'CYBERSECURITY', label: 'Cybersecurity' },
    { value: 'DEVOPS', label: 'DevOps' },
    { value: 'DATA_SCIENCE', label: 'Data Science' },
    { value: 'FULL_STACK', label: 'Full Stack Development' },
    { value: 'CLOUD_COMPUTING', label: 'Cloud Computing' },
    { value: 'SOFTWARE_ENGINEERING', label: 'Software Engineering' },
  ];

  const academicLevels = [
    { value: 'BACHELOR', label: 'Bachelor' },
    { value: 'MASTERS', label: "Master's" },
    { value: 'PHD', label: 'PhD' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Auto-save form data to localStorage
  useEffect(() => {
    if (formData.firstName || formData.school) {
      const saveData = {
        formData: formData,
        step: step
      };
      localStorage.setItem('applicationFormData', JSON.stringify(saveData));
    }
  }, [formData, step]);

  // Load saved data on mount
  useEffect(() => {
    if (!isLoading) {
      const savedData = localStorage.getItem('applicationFormData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          setStep(parsed.step || 1);
          console.log('📂 Loaded saved form data:', parsed.formData);
        } catch (e) {
          console.error('Failed to load saved form data:', e);
        }
      }
      
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      checkApplicationStatus();
    }
  }, [isAuthenticated, isLoading]);

  const checkApplicationStatus = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/api/applications/has-applied`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasApplied) {
          setHasApplied(true);
          localStorage.removeItem('applicationFormData');
          toast.success('You have already submitted an application!');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Error checking application status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setCvFile(file);
    }
  };

  const removeFile = () => {
    setCvFile(null);
    const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      console.log('📝 Submitting application with data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        school: formData.school,
        academicLevel: formData.academicLevel,
        graduationYear: formData.graduationYear,
        preferredTheme: formData.preferredTheme,
        hasCV: !!cvFile,
        cvName: cvFile?.name || 'No CV'
      });
      
      const formDataObj = new FormData();
      
      // IMPORTANT: Use EXACT field names as expected by backend DTO
      formDataObj.append('firstName', formData.firstName);
      formDataObj.append('lastName', formData.lastName)
      formDataObj.append('email', formData.email);
      formDataObj.append('phoneNumber', formData.phoneNumber || '');
      formDataObj.append('school', formData.school);
      formDataObj.append('academicLevel', formData.academicLevel);
      formDataObj.append('graduationYear', String(formData.graduationYear));
      formDataObj.append('preferredTheme', formData.preferredTheme);
      formDataObj.append('answerQuestion1', formData.answerQuestion1);
      formDataObj.append('answerQuestion2', formData.answerQuestion2);
      formDataObj.append('answerQuestion3', formData.answerQuestion3);
      formDataObj.append('answerQuestion4', formData.answerQuestion4);
      formDataObj.append('answerQuestion5', formData.answerQuestion5);
      formDataObj.append('answerQuestion6', formData.answerQuestion6);

      if (cvFile) {
        formDataObj.append('cv', cvFile);
        console.log('📎 CV file attached:', cvFile.name);
      }

      console.log('📦 FormData keys:', Array.from(formDataObj.keys()));

      const response = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataObj,
      });

      const responseData = await response.json();
      console.log('📨 Response:', response.status, responseData);

      if (!response.ok) {
        let errorMessage = 'Failed to submit application';
        if (responseData.message) {
          if (Array.isArray(responseData.message)) {
            errorMessage = responseData.message.join('\n');
          } else {
            errorMessage = responseData.message;
          }
        }
        toast.error(errorMessage);
        return;
      }

      localStorage.removeItem('applicationFormData');
      toast.success('Application submitted successfully! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.school || !formData.academicLevel || !formData.graduationYear || 
          !formData.preferredTheme) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else if (step === 2) {
      if (!formData.answerQuestion1 || !formData.answerQuestion2 || !formData.answerQuestion3) {
        toast.error('Please answer all questions');
        return;
      }
    } else if (step === 3) {
      if (!formData.answerQuestion4 || !formData.answerQuestion5 || !formData.answerQuestion6) {
        toast.error('Please answer all questions');
        return;
      }
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-12 shadow-sm max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">You've Already Applied!</h2>
          <p className="text-gray-600 mt-2">Check your dashboard for application status.</p>
          <Button className="mt-6" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Internship Application</h1>
          <p className="text-gray-600 mt-2">Complete your application to be considered for the internship program</p>
          
          {/* Progress Steps */}
          <div className="mt-6 flex justify-center items-center space-x-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s === step ? 'bg-blue-600 text-white' :
                  s < step ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && <div className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Step {step} of 4
          </p>
          {localStorage.getItem('applicationFormData') && (
            <p className="text-xs text-blue-600 mt-1">💾 Your progress is saved automatically</p>
          )}
        </div>

        <form 
          onSubmit={handleSubmit} 
          action="#" 
          method="POST"
          encType="multipart/form-data"
        >
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">School / University *</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="University Name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level *</label>
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
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="graduationYear"
                      type="number"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="2026"
                      min={2020}
                      max={2030}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Theme *</label>
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
                        <option key={theme.value} value={theme.value}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="button" onClick={nextStep} className="px-8">
                  Next Step
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Program Questions */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Program Questions</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1. Why are you interested in this internship program? *
                  </label>
                  <div className="relative">
                    <Lightbulb className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="answerQuestion1"
                      value={formData.answerQuestion1}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="What draws you to this program and what do you hope to achieve?"
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
                      name="answerQuestion2"
                      value={formData.answerQuestion2}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain your interest in a specific theme and how it aligns with your career goals"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3. What makes you a great fit for our team? *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="answerQuestion3"
                      value={formData.answerQuestion3}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your skills, experiences, and attributes that would make you successful"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Previous
                </Button>
                <Button type="button" onClick={nextStep} className="px-8">
                  Next Step <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Technical Questions */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Technical Experience</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    4. Describe a concrete project you worked on recently *
                  </label>
                  <div className="relative">
                    <Code2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="answerQuestion4"
                      value={formData.answerQuestion4}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Include: Problem Space, Solution, Your Contributions, Methodologies, Tools Used, Team Structure, Challenges, Outcomes, Lessons Learned"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    5. Describe a difficult technical challenge you faced and how you solved it *
                  </label>
                  <div className="relative">
                    <Brain className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="answerQuestion5"
                      value={formData.answerQuestion5}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="What was the challenge? How did you approach it? What was the outcome?"
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
                      name="answerQuestion6"
                      value={formData.answerQuestion6}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List specific technical skills you'd like to develop and why"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Previous
                </Button>
                <Button type="button" onClick={nextStep} className="px-8">
                  Next Step <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: CV Upload & Submit */}
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">CV Upload & Submit</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload your CV (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    {!cvFile ? (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">Drag and drop your CV here, or click to browse</p>
                        <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX (Max 5MB)</p>
                        <Input
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={() => document.getElementById('cv-upload')?.click()}
                        >
                          Choose File
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <File className="w-8 h-8 text-blue-500 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{cvFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Application Summary</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Personal Information Completed</li>
                    <li>✓ Program Questions Answered</li>
                    <li>✓ Technical Experience Shared</li>
                    {cvFile && <li>✓ CV Uploaded</li>}
                    {!cvFile && <li className="text-gray-500">○ CV Not Uploaded (Optional)</li>}
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Before Submitting
                  </h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Review all your answers for accuracy</li>
                    <li>Ensure your email is correct for communication</li>
                    <li>You cannot modify your application after submission</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Previous
                </Button>
                <Button type="submit" disabled={loading} className="px-8 bg-green-600 hover:bg-green-700">
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