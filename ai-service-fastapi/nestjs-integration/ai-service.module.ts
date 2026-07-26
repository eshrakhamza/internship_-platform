import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiServiceClient } from './ai-service.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('AI_SERVICE_URL', 'http://localhost:8000/api/v1'),
        timeout: 30000, // Groq/Gemini calls can take a few seconds
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AiServiceClient],
  exports: [AiServiceClient],
})
export class AiServiceModule {}
