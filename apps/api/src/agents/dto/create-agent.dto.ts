import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAgentDto {
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
  @IsOptional()
  backgroundStory?: string;

  @IsString()
  openingStyle: string;

  @IsString()
  lengthPreference: string;

  @IsString()
  forbiddenTopics: string;

  @IsString()
  systemPrompt: string;

  @IsBoolean()
  @IsOptional()
  isBuiltIn?: boolean;
}
