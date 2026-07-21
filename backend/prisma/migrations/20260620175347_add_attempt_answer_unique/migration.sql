/*
  Warnings:

  - A unique constraint covering the columns `[attemptId,questionId]` on the table `attempt_answers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attemptId_questionId_key" ON "attempt_answers"("attemptId", "questionId");
