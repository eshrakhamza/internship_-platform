import { Controller } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { Post, Param, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post(':candidateId/cv')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'cvs'),
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new BadRequestException('Only PDF files are supported'), false);
      }
      cb(null, true);
    },
  }),
)
async uploadCv(
  @Param('candidateId') candidateId: string,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.candidatesService.processCvUpload(candidateId, file);
}
}





// ...inside your existing CandidatesController class:

