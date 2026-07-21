import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ApplicationsModule } from './applications/applications.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { QuestionsModule } from './questions/questions.module';
import { AttemptsModule } from './attempts/attempts.module';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { UploadsModule } from './uploads/uploads.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PostingsModule } from './postings/postings.module'; // Add this
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    CandidatesModule,
    ApplicationsModule,
    AssessmentsModule,
    QuestionsModule,
    AttemptsModule,
    AiModule,
    EmailModule,
    UploadsModule,
    PostingsModule, // Add this
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}