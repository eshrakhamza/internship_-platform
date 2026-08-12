import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

// ---- Types matching the FastAPI Pydantic schemas ----






// ... dans la classe AiServiceClient ...
export interface AttemptFeedbackResponse {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  source: 'groq' | 'gemini';
}

export interface ExtractionResponse {
  text: string;
  method: 'text_layer' | 'ocr';
  page_count: number;
}
export interface GeneratedQuestion {
  type: 'MCQ' | 'OPEN';
  questionText: string;
  explanation?: string;
  expectedAnswer?: string;  // NEW
  options?: { optionText: string; isCorrect: boolean }[];
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  source: 'groq' | 'gemini';
}
export interface Experience {
  title: string;
  company: string;
  duration?: string;
  description?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
}

export interface Project {
  name: string;
  period?: string;
  description?: string;
  technologies: string[];
}

export interface StructuredCV {
  full_name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];   // ← add
  education: Education[];
  languages: string[];
  summary?: string;
}

export interface MatchExplanationResponse {
  explanation: string;
}
export interface GradingResponse {
  score: number;      // 0-100
  feedback: string;
  source: 'groq' | 'gemini';
}

export interface SchedulingResponse {
  reply: string;
  proposed_slots: string[];
}

export interface LinkedInPostResponse {
  post: string;
}

@Injectable()
export class AiServiceClient {
  private readonly headers: Record<string, string>;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.headers = {
      'X-Internal-Key': this.config.get<string>('INTERNAL_API_KEY', ''),
    };
  }

  async extractCv(fileBuffer: Buffer, filename: string): Promise<ExtractionResponse> {
    const form = new FormData();
    form.append('file', fileBuffer, { filename, contentType: 'application/pdf' });

    const { data } = await firstValueFrom(
      this.http.post<ExtractionResponse>('/extraction/cv', form, {
        headers: { ...this.headers, ...form.getHeaders() },
      }),
    );
    return data;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const { data } = await firstValueFrom(
      this.http.post<{ vector: number[]; dimensions: number }>(
        '/embeddings/generate',
        { text },
        { headers: this.headers },
      ),
    );
    return data.vector;
  }

  async structureCv(rawText: string): Promise<StructuredCV> {
    const { data } = await firstValueFrom(
      this.http.post<StructuredCV>(
        '/structuring/cv',
        { text: rawText },
        { headers: this.headers },
      ),
    );
    return data;
  }

  async explainMatch(
    cvSummary: string,
    jobDescription: string,
    similarityScore: number,
  ): Promise<MatchExplanationResponse> {
    const { data } = await firstValueFrom(
      this.http.post<MatchExplanationResponse>(
        '/matching/explain',
        {
          cv_summary: cvSummary,
          job_description: jobDescription,
          similarity_score: similarityScore,
        },
        { headers: this.headers },
      ),
    );
    return data;
  }

  async gradeAnswer(
    question: string,
    expectedAnswer: string,
    candidateAnswer: string,
    rubric?: string,
  ): Promise<GradingResponse> {
    const { data } = await firstValueFrom(
      this.http.post<GradingResponse>(
        '/grading/answer',
        {
          question,
          expected_answer: expectedAnswer,
          candidate_answer: candidateAnswer,
          rubric,
        },
        { headers: this.headers },
      ),
    );
    return data;
  }

  async scheduleInterview(candidateMessage: string, context?: string): Promise<SchedulingResponse> {
    const { data } = await firstValueFrom(
      this.http.post<SchedulingResponse>(
        '/scheduling/interview',
        { candidate_message: candidateMessage, context },
        { headers: this.headers },
      ),
    );
    return data;
  }

  async generateLinkedInPost(
    achievementSummary: string,
    tone = 'professional',
  ): Promise<LinkedInPostResponse> {
    const { data } = await firstValueFrom(
      this.http.post<LinkedInPostResponse>(
        '/linkedin/generate',
        { achievement_summary: achievementSummary, tone },
        { headers: this.headers },
      ),
    );
    return data;
  }

  /**
   * Raw prompt -> raw text passthrough via Groq. Used by flows that have
   * their own custom prompt-building and text-parsing logic already
   * (e.g. the application-scoring flow migrated from Ollama) so that
   * logic doesn't need to change — only the model backend does.
   */
  async generateAnalysis(prompt: string, system?: string): Promise<string> {
    const { data } = await firstValueFrom(
      this.http.post<{ text: string }>(
        '/analysis/generate',
        { prompt, system },
        { headers: this.headers },
      ),
    );
    return data.text;
  }

  /**
   * Combines CV data + application answers into one structured analysis call.
   * Replaces the old prompt-building + regex-parsing that lived in NestJS —
   * FastAPI now owns the whole "call Groq, get clean JSON back" step.
   */
  async analyzeApplication(payload: {
    candidateName: string;
    school?: string;
    academicLevel?: string;
    preferredTheme?: string;
    answers: string[];
    cvSummary?: string;
    cvSkills?: string[];
    cvExperience?: any[];
    cvProjects?: any[];   // ← add
    cvEducation?: any[];
  }): Promise<{ summary: string; theme: string; score: number; explanation: string }> {
    const { data } = await firstValueFrom(
      this.http.post(
        '/analysis/application',
        {
          candidate_name: payload.candidateName,
          school: payload.school,
          academic_level: payload.academicLevel,
          preferred_theme: payload.preferredTheme,
          answers: payload.answers,
          cv_summary: payload.cvSummary,
          cv_skills: payload.cvSkills ?? [],
          cv_experience: payload.cvExperience ?? [],
          cv_projects: payload.cvProjects ?? [],   // ← add
          cv_education: payload.cvEducation ?? [],
        },
        { headers: this.headers },
      ),
    );
    return data;
  }
  // Inside the AiServiceClient class, alongside gradeAnswer/structureCv/etc.

  async generateQuestions(
    theme: string,
    difficulty: string,
    mcqCount: number,
    openCount: number,
  ): Promise<QuestionGenerationResponse> {
    const { data } = await firstValueFrom(
      this.http.post<QuestionGenerationResponse>(
        '/questions/generate',
        {
          theme,
          difficulty,
          mcq_count: mcqCount,
          open_count: openCount,
        },
        { headers: this.headers },
      ),
    );
    return data;
  }

  async getAttemptFeedback(payload: {
    assessmentTitle: string;
    theme: string;
    mcqScore: number;
    openScore: number;
    totalScore: number;
    answers: { question: string; answer: string; isCorrect?: boolean; score?: number }[];
  }): Promise<AttemptFeedbackResponse> {
    const { data } = await firstValueFrom(
      this.http.post<AttemptFeedbackResponse>(
        '/feedback/attempt',
        {
          assessment_title: payload.assessmentTitle,
          theme: payload.theme,
          mcq_score: payload.mcqScore,
          open_score: payload.openScore,
          total_score: payload.totalScore,
          answers: payload.answers.map(a => ({
            question: a.question,
            answer: a.answer,
            is_correct: a.isCorrect,
            score: a.score,
          })),
        },
        { headers: this.headers },
      ),
    );
    return data;
  }
}