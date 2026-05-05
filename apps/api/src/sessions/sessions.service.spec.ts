import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: {
            therapySession: {
              findMany: vi.fn(),
              findUnique: vi.fn(),
              update: vi.fn(),
            },
            sessionMessage: {
              create: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all sessions', async () => {
      const mockSessions = [{ id: '1', sessionNumber: 1 }];
      vi.spyOn(prisma.therapySession, 'findMany').mockResolvedValue(mockSessions as any);

      const result = await service.findAll();
      expect(result).toEqual(mockSessions);
    });
  });
});
