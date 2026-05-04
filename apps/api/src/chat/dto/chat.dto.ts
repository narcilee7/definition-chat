import { IsString, IsArray } from 'class-validator';

export class ChatDto {
  @IsString()
  sessionId: string;

  @IsString()
  agentId: string;

  @IsString()
  content: string;
}

export class MultiChatDto {
  @IsString()
  sessionId: string;

  @IsArray()
  @IsString({ each: true })
  agentIds: string[];

  @IsString()
  content: string;
}
