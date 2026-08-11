import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { AiServiceClient } from './../ai/ai-service.client';
import { PrismaService } from 'prisma/prisma.service';



@Injectable()
export class CandidatesService {

    constructor(
        private readonly prisma: PrismaService,   // however it's currently injected
        private readonly aiServiceClient: AiServiceClient,
        // ...whatever else you already have
      ) {}

      async processCvUpload(candidateId: string, uploaded: Express.Multer.File) {
        const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) {
          throw new NotFoundException('Candidate not found');
        }
      
        const fileRecord = await this.prisma.file.create({
          data: {
            filename: uploaded.filename,
            originalName: uploaded.originalname,
            mimeType: uploaded.mimetype,
            path: uploaded.path,
            size: uploaded.size,
          },
        });
      
        await this.prisma.candidate.update({
          where: { id: candidateId },
          data: { cvFileId: fileRecord.id },
        });
      
        const fileBuffer = await readFile(uploaded.path);
        const extraction = await this.aiServiceClient.extractCv(fileBuffer, uploaded.originalname);
        const structured = await this.aiServiceClient.structureCv(extraction.text);
        const embedding = await this.aiServiceClient.generateEmbedding(extraction.text);
      
        const cvData = await this.prisma.candidateCV.upsert({
          where: { candidateId },
          create: {
            candidateId,
            fileId: fileRecord.id,
            rawText: extraction.text,
            extractionMethod: extraction.method,
            fullName: structured.full_name,
            email: structured.email,
            phone: structured.phone,
            skills: structured.skills,
            experience: structured.experience as any,
            education: structured.education as any,
            languages: structured.languages,
            summary: structured.summary,
            embedding: embedding as any,
          },
          update: {
            fileId: fileRecord.id,
            rawText: extraction.text,
            extractionMethod: extraction.method,
            fullName: structured.full_name,
            email: structured.email,
            phone: structured.phone,
            skills: structured.skills,
            experience: structured.experience as any,
            education: structured.education as any,
            languages: structured.languages,
            summary: structured.summary,
            embedding: embedding as any,
          },
        });
      
        return { file: fileRecord, cvData, structured };
      }
}





// ...inside your existing CandidatesService class, add to the constructor:



