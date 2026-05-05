import { Test, TestingModule } from '@nestjs/testing';
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
            chat: jest.fn(),
            streamChat: jest.fn(),
          },
        },
        {
          provide: SessionManagerService,
          useValue: {
            createSession: jest.fn(),
            getSessionState: jest.fn(),
            setPhase: jest.fn(),
            persistSession: jest.fn(),
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
