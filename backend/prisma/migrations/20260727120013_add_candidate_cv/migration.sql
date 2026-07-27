-- CreateTable
CREATE TABLE "candidate_cvs" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fileId" TEXT,
    "rawText" TEXT NOT NULL,
    "extractionMethod" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "skills" TEXT[],
    "experience" JSONB,
    "education" JSONB,
    "languages" TEXT[],
    "summary" TEXT,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_cvs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_cvs_candidateId_key" ON "candidate_cvs"("candidateId");

-- AddForeignKey
ALTER TABLE "candidate_cvs" ADD CONSTRAINT "candidate_cvs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
