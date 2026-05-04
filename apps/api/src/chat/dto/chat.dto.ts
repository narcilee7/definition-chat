import { IsString } from 'class-validator';

export class ChatDto {
  @IsString()
  sessionId: string;

  @IsString()
  content: string;
}
