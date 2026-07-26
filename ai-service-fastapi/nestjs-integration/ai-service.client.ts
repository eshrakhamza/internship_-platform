import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// ---- Types matching the FastAPI Pydantic schemas ----

export interface ExtractionResponse {
  text: string;
  method: 'text_layer' | 'ocr';
  page_count: number;
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

export interface StructuredCV {
  full_name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  languages: string[];
  summary?: string;
}

export interface MatchExplanationResponse {
  explanation: string;
}

export interface GradingResponse {
  score: number;
  feedback: string;
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
    form.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), filename);

    const { data } = await firstValueFrom(
      this.http.post<ExtractionResponse>('/extraction/cv', form, { headers: this.headers }),
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
}
