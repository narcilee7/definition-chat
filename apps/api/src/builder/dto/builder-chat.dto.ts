import { IsString } from 'class-validator';

export class BuilderChatDto {
  @IsString()
  sessionId: string;

  @IsString()
  content: string;
}

export class ConfirmAgentDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsString()
  tone: string;

  @IsString()
  color: string;

  @IsString()
  description: string;

  @IsString()
  coreTraits: string;

  @IsString()
  communicationStyle: string;

  @IsString()
  expertise: string;

  @IsString()
  backgroundStory?: string;

  @IsString()
  openingStyle: string;

  @IsString()
  lengthPreference: string;

  @IsString()
  forbiddenTopics: string;

  @IsString()
  systemPrompt: string;
}
