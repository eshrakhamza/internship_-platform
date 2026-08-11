-- CreateTable
CREATE TABLE "match_runs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "match_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL,
    "matchRunId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_results_matchRunId_candidateId_key" ON "match_results"("matchRunId", "candidateId");

-- AddForeignKey
ALTER TABLE "match_runs" ADD CONSTRAINT "match_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "internship_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_matchRunId_fkey" FOREIGN KEY ("matchRunId") REFERENCES "match_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
