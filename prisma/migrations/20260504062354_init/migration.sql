-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "core_traits" TEXT NOT NULL,
    "communication_style" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "background_story" TEXT,
    "opening_style" TEXT NOT NULL,
    "length_preference" TEXT NOT NULL,
    "forbidden_topics" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "mode" TEXT NOT NULL,
    "agent_ids" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "agent_id" TEXT,
    "session_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AgentToSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AgentToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AgentToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_name_key" ON "agents"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_AgentToSession_AB_unique" ON "_AgentToSession"("A", "B");

-- CreateIndex
CREATE INDEX "_AgentToSession_B_index" ON "_AgentToSession"("B");
