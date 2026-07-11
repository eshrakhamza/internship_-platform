import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

// Define the Ollama response type
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl = 'http://localhost:11434/api/generate';
  private readonly modelName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.modelName = this.configService.get<string>('OLLAMA_MODEL') || 'gemma:2b';
    this.logger.log(`AI service initialized with Ollama using model: ${this.modelName}`);
  }

  public async callOllama(prompt: string): Promise<string> {
    try {
      this.logger.log(`Calling Ollama with model: ${this.modelName}`);
      const response = await axios.post<OllamaResponse>(this.ollamaUrl, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
      });
      
      this.logger.log('Ollama response received');
      return response.data.response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Ollama error: ${errorMessage}`);
      if (error instanceof Error && (error as any).code === 'ECONNREFUSED') {
        this.logger.error('Ollama is not running. Start it with: ollama serve');
      }
      throw error;
    }
  }

  async analyzeApplication(applicationId: string) {
    this.logger.log(`Analyzing application: ${applicationId}`);

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if AI analysis already exists
    const existingAnalysis = await this.prisma.aIAnalysis.findUnique({
      where: { applicationId },
    });

    if (existingAnalysis) {
      this.logger.log(`AI analysis already exists for application: ${applicationId}`);
      return existingAnalysis;
    }

    try {
      this.logger.log('Generating AI analysis with Ollama...');
      const prompt = this.buildAnalysisPrompt(application);
      
      const analysisText = await this.callOllama(prompt);
      
      this.logger.log(`Ollama response received (${analysisText.length} characters)`);
      this.logger.debug(`Response: ${analysisText.substring(0, 200)}...`);
      
      const analysis = this.parseAnalysis(analysisText);

      const savedAnalysis = await this.prisma.aIAnalysis.create({
        data: {
          applicationId: applicationId,
          candidateId: application.candidate.id,
          candidateSummary: analysis.summary || 'Candidate shows strong potential.',
          themeClassification: analysis.theme || application.candidate.preferredTheme || 'FULL_STACK',
          recommendationScore: analysis.score || 75,
          recommendationExplanation: analysis.explanation || 'Candidate shows strong potential based on application.',
        },
      });

      this.logger.log(`AI analysis saved for application: ${applicationId}`);
      return savedAnalysis;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI analysis failed: ${errorMessage}`);
      return this.createFallbackAnalysis(application);
    }
  }

  private buildAnalysisPrompt(application: any): string {
    return `Analyze this internship application and provide a structured evaluation.
  
  Candidate Information:
  - Name: ${application.candidate.user.firstName} ${application.candidate.user.lastName}
  - School: ${application.candidate.school || 'Not provided'}
  - Academic Level: ${application.candidate.academicLevel || 'Not provided'}
  - Preferred Theme: ${application.candidate.preferredTheme || 'Not specified'}
  
  Application Answers:
  1. What do you know about our company?
  ${application.answerQuestion1}
  
  2. Which internship theme interests you the most and why?
  ${application.answerQuestion2}
  
  3. What motivates you to join our company?
  ${application.answerQuestion3}
  
  4. Describe a concrete project you worked on recently:
  ${application.answerQuestion4}
  
  5. Describe a difficult technical challenge you faced and how you solved it:
  ${application.answerQuestion5}
  
  6. What technical skills do you want to improve during your internship?
  ${application.answerQuestion6}
  
  Provide your response in this exact format:
  
  ## SUMMARY
  [A 2-3 sentence summary of the candidate]
  
  ## THEME
  [Best theme match from: AI, Security, DevOps, Data Science, Full Stack]
  
  ## SCORE
  [Score from 0-100]
  
  ## EXPLANATION
  [Brief explanation of the score]`;
  }

  private parseAnalysis(text: string): any {
    const result = {
      summary: '',
      theme: '',
      score: 75,
      explanation: '',
    };
  
    // Log the raw response for debugging
    this.logger.debug(`Raw Ollama response: ${text.substring(0, 500)}...`);
  
    // Try multiple parsing strategies
    const lines = text.split('\n');
    let currentSection = '';
    let summaryLines: string[] = [];
    let explanationLines: string[] = [];
  
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
  
      // Check for section headers (## SUMMARY, ## THEME, etc.)
      if (trimmedLine.startsWith('## SUMMARY')) {
        currentSection = 'summary';
        continue;
      } else if (trimmedLine.startsWith('## THEME')) {
        currentSection = 'theme';
        continue;
      } else if (trimmedLine.startsWith('## SCORE')) {
        currentSection = 'score';
        continue;
      } else if (trimmedLine.startsWith('## EXPLANATION')) {
        currentSection = 'explanation';
        continue;
      }
  
      // Also check for the format we originally wanted
      if (trimmedLine.startsWith('SUMMARY:')) {
        result.summary = trimmedLine.replace('SUMMARY:', '').trim();
        continue;
      } else if (trimmedLine.startsWith('THEME:')) {
        const theme = trimmedLine.replace('THEME:', '').trim().toUpperCase();
        const validThemes = ['AI', 'SECURITY', 'DEVOPS', 'DATA_SCIENCE', 'FULL_STACK'];
        result.theme = validThemes.includes(theme) ? theme : 'FULL_STACK';
        continue;
      } else if (trimmedLine.startsWith('SCORE:')) {
        const scoreText = trimmedLine.replace('SCORE:', '').trim();
        // Handle scores like "8/10" or "85"
        const match = scoreText.match(/(\d+)/);
        if (match) {
          const score = parseInt(match[1]);
          result.score = Math.min(100, Math.max(0, score * 10 || 75));
        }
        continue;
      } else if (trimmedLine.startsWith('EXPLANATION:')) {
        result.explanation = trimmedLine.replace('EXPLANATION:', '').trim();
        continue;
      }
  
      // Collect content based on current section
      if (currentSection === 'summary') {
        // Skip lines that are just **bold** markers
        if (!trimmedLine.startsWith('**')) {
          summaryLines.push(trimmedLine);
        }
      } else if (currentSection === 'explanation') {
        // Skip lines that are just **bold** markers
        if (!trimmedLine.startsWith('**')) {
          explanationLines.push(trimmedLine);
        }
      } else if (currentSection === 'score') {
        // Try to extract score from the line
        const match = trimmedLine.match(/(\d+)\/10/);
        if (match) {
          result.score = parseInt(match[1]) * 10;
        } else {
          const scoreMatch = trimmedLine.match(/(\d+)/);
          if (scoreMatch) {
            const score = parseInt(scoreMatch[1]);
            result.score = Math.min(100, Math.max(0, score));
          }
        }
      } else if (currentSection === 'theme') {
        // Extract theme from the line
        const themeMatch = trimmedLine.match(/\*\*(.*?)\*\*/);
        if (themeMatch) {
          const theme = themeMatch[1].toUpperCase().trim();
          const validThemes = ['AI', 'SECURITY', 'DEVOPS', 'DATA_SCIENCE', 'FULL_STACK'];
          if (validThemes.some(t => theme.includes(t))) {
            result.theme = validThemes.find(t => theme.includes(t)) || 'FULL_STACK';
          }
        }
      }
    }
  
    // If we collected summary lines, join them
    if (summaryLines.length > 0) {
      result.summary = summaryLines.join(' ').trim();
    }
  
    // If we collected explanation lines, join them
    if (explanationLines.length > 0) {
      result.explanation = explanationLines.join(' ').trim();
    }
  
    // If we couldn't parse anything meaningful, use fallback
    if (!result.summary && !result.explanation) {
      this.logger.warn('Could not parse AI response, using fallback values');
      result.summary = 'Candidate submitted a complete application with detailed responses.';
      result.theme = 'FULL_STACK';
      result.score = 70;
      result.explanation = 'Application shows good effort and relevant skills. Manual review recommended.';
    }
  
    this.logger.debug(`Parsed result - Summary: ${result.summary.substring(0, 100)}...`);
    this.logger.debug(`Parsed result - Theme: ${result.theme}, Score: ${result.score}`);
  
    return result;
  }

  private createFallbackAnalysis(application: any): any {
    this.logger.log(`Creating fallback analysis for application: ${application.id}`);
    
    return {
      id: 'fallback-' + Date.now(),
      applicationId: application.id,
      candidateId: application.candidate.id,
      candidateSummary: 'Candidate submitted a complete application with detailed responses about their experience and skills.',
      themeClassification: application.candidate.preferredTheme || 'FULL_STACK',
      recommendationScore: 70,
      recommendationExplanation: 'Application shows good effort and relevant skills. Manual review recommended for final decision.',
      generatedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async analyzeAllPendingApplications() {
    const applications = await this.prisma.application.findMany({
      where: {
        aiAnalysis: null,
      },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(`Found ${applications.length} applications without AI analysis`);

    const results: Array<{
      applicationId: string;
      status: string;
      analysis?: any;
      error?: string;
    }> = [];

    for (const app of applications) {
      try {
        const analysis = await this.analyzeApplication(app.id);
        results.push({
          applicationId: app.id,
          status: 'success',
          analysis
        });
        this.logger.log(`Successfully analyzed application: ${app.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to analyze application ${app.id}: ${errorMessage}`);
        results.push({
          applicationId: app.id,
          status: 'error',
          error: errorMessage
        });
      }
    }

    return results;
  }
}