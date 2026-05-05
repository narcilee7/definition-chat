-- AlterTable
ALTER TABLE "therapy_sessions"
ADD COLUMN IF NOT EXISTS "session_summary" TEXT,
ADD COLUMN IF NOT EXISTS "summary_generated_at" TIMESTAMP(3);
