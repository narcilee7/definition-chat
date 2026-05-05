import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SessionManagerService } from '../therapy/session-manager.service';

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            chat: vi.fn(),
            streamChat: vi.fn(),
          },
        },
        {
          provide: SessionManagerService,
          useValue: {
            createSession: vi.fn(),
            getSessionState: vi.fn(),
            setPhase: vi.fn(),
            persistSession: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
