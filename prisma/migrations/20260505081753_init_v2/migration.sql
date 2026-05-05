-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMP(3),
    "data_retention" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "age_range" TEXT,
    "gender" TEXT,
    "occupation" TEXT,
    "relationship_status" TEXT,
    "prior_therapy" BOOLEAN NOT NULL DEFAULT false,
    "prior_diagnosis" TEXT,
    "medications" TEXT,
    "preferred_style" TEXT,
    "language" TEXT NOT NULL DEFAULT 'zh',

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_approaches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_built_in" BOOLEAN NOT NULL DEFAULT true,
    "session_structure" JSONB NOT NULL,
    "intervention_library" JSONB NOT NULL,
    "assessment_tools" TEXT[],
    "system_prompt_template" TEXT NOT NULL,
    "created_by" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "therapy_approaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_personas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "approach_id" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 1024,
    "style_traits" JSONB NOT NULL,
    "voice_tone" TEXT NOT NULL,
    "specialties" TEXT[],
    "boundaries" TEXT[],
    "is_built_in" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "therapist_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_formulations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "presenting_problems" TEXT NOT NULL,
    "triggers" TEXT,
    "thoughts" TEXT,
    "emotions" TEXT,
    "behaviors" TEXT,
    "physical" TEXT,
    "core_beliefs" TEXT[],
    "intermediate_beliefs" TEXT[],
    "coping_strategies" TEXT[],
    "formative_events" TEXT,
    "treatment_goals" JSONB[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previous_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_formulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "agenda" JSONB[],
    "pre_mood" JSONB,
    "post_mood" JSONB,
    "risk_screening" JSONB,
    "risk_level" TEXT NOT NULL DEFAULT 'none',
    "insights" TEXT[],
    "homework" JSONB[],
    "skills_introduced" TEXT[],
    "alliance_rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapy_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intervention_type" TEXT,
    "technique_used" TEXT,
    "risk_flag" BOOLEAN NOT NULL DEFAULT false,
    "latency_ms" INTEGER,
    "token_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "responses" JSONB[],
    "total_score" INTEGER NOT NULL,
    "severity" TEXT,
    "clinical_cutoff" BOOLEAN NOT NULL DEFAULT false,
    "risk_flags" TEXT[],
    "session_id" TEXT,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "warning_signs" TEXT[],
    "coping_strategies" TEXT[],
    "distractions" TEXT[],
    "support_people" JSONB[],
    "professionals" JSONB[],
    "environment_safety" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger_message" TEXT,
    "trigger_type" TEXT,
    "ai_response" TEXT,
    "user_follow_up" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "session_id" TEXT,

    CONSTRAINT "crisis_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "therapy_approaches_name_key" ON "therapy_approaches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "safety_plans_user_id_key" ON "safety_plans"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_personas" ADD CONSTRAINT "therapist_personas_approach_id_fkey" FOREIGN KEY ("approach_id") REFERENCES "therapy_approaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_formulations" ADD CONSTRAINT "case_formulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapist_personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_messages" ADD CONSTRAINT "session_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "therapy_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_plans" ADD CONSTRAINT "safety_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_logs" ADD CONSTRAINT "crisis_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
