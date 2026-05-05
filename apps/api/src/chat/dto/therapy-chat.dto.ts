import { IsString, IsOptional } from 'class-validator';

export class TherapyChatDto {
  @IsString()
  sessionId: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  moodRating?: string;
}

export class CreateTherapySessionDto {
  @IsString()
  userId: string;

  @IsString()
  therapistId: string;

  @IsString()
  @IsOptional()
  presentingProblem?: string;
}
