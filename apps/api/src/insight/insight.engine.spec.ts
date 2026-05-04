import { describe, it, expect, beforeEach } from 'vitest';
import { InsightEngine } from './insight.engine';
import { PrismaService } from '../prisma/prisma.service';

function createMockPrisma() {
  const sessions: any[] = [];
  const memoryNotes: any[] = [];
  const userContexts: any[] = [];

  return {
    session: {
      findUnique: async ({ where }: any) => {
        const s = sessions.find((s) => s.id === where.id);
        if (!s) return null;
        return { ...s, messages: s.messages || [] };
      },
      update: async ({ where, data }: any) => {
        const s = sessions.find((s) => s.id === where.id);
        if (s) Object.assign(s, data);
        return s;
      },
    },
    memoryNote: {
      create: async ({ data }: any) => {
        const note = { id: `note_${memoryNotes.length + 1}`, ...data };
        memoryNotes.push(note);
        return note;
      },
      findMany: async () => memoryNotes,
    },
    userContext: {
      findUnique: async ({ where }: any) => {
        return userContexts.find((u) => u.userId === where.userId) || null;
      },
      upsert: async ({ where, update, create }: any) => {
        let u = userContexts.find((u) => u.userId === where.userId);
        if (u) Object.assign(u, update);
        else {
          u = { ...create, userId: where.userId };
          userContexts.push(u);
        }
        return u;
      },
    },
    _data: { sessions, memoryNotes, userContexts },
  } as unknown as PrismaService & { _data: any };
}

describe('InsightEngine', () => {
  let engine: InsightEngine;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    engine = new InsightEngine(prisma);
  });

  it('should not process session with fewer than 2 messages', async () => {
    const sessionId = 'sess_1';
    prisma._data.sessions.push({
      id: sessionId,
      messages: [{ id: 'm1', role: 'user', content: 'hello' }],
    });

    // processSession uses LLM calls — mock them or just verify no crash
    await expect(engine.processSession(sessionId)).resolves.toBeUndefined();
    expect(prisma._data.memoryNotes).toHaveLength(0);
  });

  it('should not process non-existent session', async () => {
    await expect(engine.processSession('nonexistent')).resolves.toBeUndefined();
  });
});
