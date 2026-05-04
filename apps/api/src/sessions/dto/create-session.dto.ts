import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  mode: string;

  @IsArray()
  @IsString({ each: true })
  agentIds: string[];

  @IsString()
  @IsOptional()
  title?: string;
}
