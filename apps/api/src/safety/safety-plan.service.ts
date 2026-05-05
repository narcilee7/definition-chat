import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SafetyPlanService {
  private readonly logger = createLogger('SafetyPlanService');

  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    const plan = await this.prisma.safetyPlan.findUnique({
      where: { userId },
    });

    if (!plan) {
      // Return default template
      return {
        userId,
        warningSigns: ['情绪极度低落', '失眠超过3天', '失去食欲', '回避所有人'],
        copingStrategies: ['深呼吸5次', '出门散步10分钟', '听喜欢的音乐', '写情绪日记'],
        distractions: ['看电影', '整理房间', '做运动', '给朋友发消息'],
        supportPeople: [],
        professionals: [
          { name: '24小时危机热线', phone: '400-161-9995', role: '危机干预' },
          { name: '北京心理危机干预中心', phone: '010-82951332', role: '危机干预' },
        ],
      };
    }

    return plan;
  }

  async upsert(userId: string, data: any) {
    const plan = await this.prisma.safetyPlan.upsert({
      where: { userId },
      update: {
        warningSigns: data.warningSigns,
        copingStrategies: data.copingStrategies,
        distractions: data.distractions,
        supportPeople: data.supportPeople as any,
        professionals: data.professionals as any,
        environmentSafety: data.environmentSafety,
      },
      create: {
        userId,
        warningSigns: data.warningSigns || [],
        copingStrategies: data.copingStrategies || [],
        distractions: data.distractions || [],
        supportPeople: data.supportPeople as any || [],
        professionals: data.professionals as any || [],
        environmentSafety: data.environmentSafety,
      },
    });

    this.logger.info('Safety plan updated', { userId });
    return plan;
  }
}
