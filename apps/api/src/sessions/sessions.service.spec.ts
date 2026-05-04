import { describe, it, expect, beforeEach } from 'vitest';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

// Simple in-memory mock for Prisma
function createMockPrisma() {
  const sessions: any[] = [];
  const messages: any[] = [];
  let sessionCounter = 0;
  let msgCounter = 0;

  return {
    session: {
      create: async ({ data }: any) => {
        const s = {
          id: `sess_${++sessionCounter}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sessions.push(s);
        return s;
      },
      findMany: async ({ orderBy }: any) => {
        return [...sessions].sort((a, b) =>
          orderBy?.updatedAt === 'desc'
            ? b.updatedAt.getTime() - a.updatedAt.getTime()
            : a.updatedAt.getTime() - b.updatedAt.getTime()
        );
      },
      findUnique: async ({ where }: any) => {
        return sessions.find((s) => s.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        const s = sessions.find((s) => s.id === where.id);
        if (s) Object.assign(s, data, { updatedAt: new Date() });
        return s;
      },
    },
    message: {
      create: async ({ data }: any) => {
        const m = {
          id: `msg_${++msgCounter}`,
          ...data,
          createdAt: new Date(),
        };
        messages.push(m);
        return m;
      },
    },
  } as unknown as PrismaService;
}

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new SessionsService(prisma);
  });

  it('should create a session with default title', async () => {
    const session = await service.create({});
    expect(session.title).toContain('探索');
    expect(session.intent).toBeUndefined();
  });

  it('should create a session with intent and mood', async () => {
    const session = await service.create({
      intent: '工作压力',
      mood: '焦虑',
    });
    expect(session.intent).toBe('工作压力');
    expect(session.mood).toBe('焦虑');
  });

  it('should add a message and update session timestamp', async () => {
    const session = await service.create({});
    const before = session.updatedAt;

    await new Promise((r) => setTimeout(r, 10));
    const msg = await service.addMessage(session.id, 'user', 'hello');

    expect(msg.role).toBe('user');
    expect(msg.content).toBe('hello');

    const updated = await prisma.session.findUnique({ where: { id: session.id } });
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('should find all sessions ordered by updatedAt desc', async () => {
    await service.create({ title: 'First' });
    await new Promise((r) => setTimeout(r, 10));
    await service.create({ title: 'Second' });

    const all = await service.findAll();
    expect(all).toHaveLength(2);
    expect(all[0].title).toBe('Second');
    expect(all[1].title).toBe('First');
  });
});
