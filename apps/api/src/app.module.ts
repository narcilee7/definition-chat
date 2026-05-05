import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OhmeLoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { TherapyModule } from './therapy/therapy.module';
import { CaseFormulationModule } from './case-formulation/case-formulation.module';
import { RiskModule } from './risk/risk.module';
import { ChatModule } from './chat/chat.module';
import { SessionsModule } from './sessions/sessions.module';
import { BuilderModule } from './builder/builder.module';
import { InsightModule } from './insight/insight.module';
import { AssessmentModule } from './assessment/assessment.module';
import { SafetyModule } from './safety/safety.module';
import { RefractionModule } from './refraction/refraction.module';
import { AgentsModule } from './agents/agents.module';
import { AgentLoaderService } from './agent-loader.service';
import { ExploreModule } from './explore/explore.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OhmeLoggerModule,
    PrismaModule,
    TherapyModule,
    CaseFormulationModule,
    RiskModule,
    AgentsModule,
    SessionsModule,
    ChatModule,
    BuilderModule,
    InsightModule,
    AssessmentModule,
    SafetyModule,
    RefractionModule,
    ExploreModule,
  ],
  providers: [AgentLoaderService],
})
export class AppModule {}
