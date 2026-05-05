import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  compileSystemPrompt,
  CaseFormulationContext,
  PhaseContext,
  PersonaContext,
} from '@ohme/prompts';

@Injectable()
export class PromptBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildSystemPrompt(params: {
    userId: string;
    therapistId: string;
    phaseContext: PhaseContext;
  }): Promise<string> {
    const { userId, therapistId, phaseContext } = params;

    // Load therapist persona
    const persona = await this.prisma.therapistPersona.findUnique({
      where: { id: therapistId },
      include: { approach: true },
    });

    if (!persona) {
      throw new Error(`TherapistPersona not found: ${therapistId}`);
    }

    // Load case formulation
    const caseFormulation = await this.prisma.caseFormulation.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });

    // Build persona context
    const personaContext: PersonaContext = {
      name: persona.name,
      description: persona.description,
      styleTraits: (persona.styleTraits as any) || { directness: 0.5, warmth: 0.5, structure: 0.5, depth: 0.5 },
      voiceTone: persona.voiceTone,
      specialties: persona.specialties,
      boundaries: persona.boundaries,
      responseLength: 'concise',
    };

    // Build case formulation context
    const cfContext: CaseFormulationContext | undefined = caseFormulation
      ? {
          presentingProblems: caseFormulation.presentingProblems,
          triggers: caseFormulation.triggers,
          thoughts: caseFormulation.thoughts,
          emotions: caseFormulation.emotions,
          behaviors: caseFormulation.behaviors,
          physical: caseFormulation.physical,
          coreBeliefs: caseFormulation.coreBeliefs,
          intermediateBeliefs: caseFormulation.intermediateBeliefs,
          copingStrategies: caseFormulation.copingStrategies,
          formativeEvents: caseFormulation.formativeEvents ?? undefined,
          treatmentGoals: (caseFormulation.treatmentGoals as any[]) || [],
          confidence: caseFormulation.confidence,
          version: caseFormulation.version,
        }
      : undefined;

    return compileSystemPrompt({
      approachName: persona.approach.name,
      persona: personaContext,
      caseFormulation: cfContext,
      phaseContext,
    });
  }
}
