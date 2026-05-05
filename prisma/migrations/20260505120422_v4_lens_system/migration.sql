-- CreateTable
CREATE TABLE "lenses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "description" TEXT,
    "domains" TEXT[],
    "sees" TEXT[],
    "ignores" TEXT[],
    "explains_pain_as" TEXT NOT NULL,
    "core_questions" TEXT[],
    "exploration_moves" TEXT[],
    "risks" TEXT[],
    "safety_boundary" TEXT[],
    "output_structure" JSONB,
    "tone" JSONB,
    "author_id" TEXT,
    "author_name" TEXT,
    "forked_from" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "fork_count" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exploration_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lens_id" TEXT NOT NULL,
    "original_question" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'clarify',
    "clarified_question" TEXT,
    "identified_signals" TEXT[],
    "hypothesis" TEXT,
    "user_validation" TEXT,
    "revised_hypothesis" TEXT,
    "new_narrative" TEXT,
    "selected_experiment" TEXT,
    "self_model_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "exploration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exploration_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exploration_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_models" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "top_themes" JSONB,
    "top_lenses" JSONB,
    "recurring_patterns" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "self_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_model_entries" (
    "id" TEXT NOT NULL,
    "self_model_id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "original_narrative" TEXT,
    "new_narrative" TEXT NOT NULL,
    "lens_id" TEXT NOT NULL,
    "lens_name" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "session_id" TEXT,
    "user_edited" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "self_model_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "self_model_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_lens_id" TEXT NOT NULL,
    "source_lens_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "reflection" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exploration_sessions_self_model_entry_id_key" ON "exploration_sessions"("self_model_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "self_models_user_id_key" ON "self_models"("user_id");

-- AddForeignKey
ALTER TABLE "lenses" ADD CONSTRAINT "lenses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exploration_sessions" ADD CONSTRAINT "exploration_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exploration_sessions" ADD CONSTRAINT "exploration_sessions_lens_id_fkey" FOREIGN KEY ("lens_id") REFERENCES "lenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exploration_sessions" ADD CONSTRAINT "exploration_sessions_self_model_entry_id_fkey" FOREIGN KEY ("self_model_entry_id") REFERENCES "self_model_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exploration_messages" ADD CONSTRAINT "exploration_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exploration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_models" ADD CONSTRAINT "self_models_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_model_entries" ADD CONSTRAINT "self_model_entries_self_model_id_fkey" FOREIGN KEY ("self_model_id") REFERENCES "self_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_self_model_id_fkey" FOREIGN KEY ("self_model_id") REFERENCES "self_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
