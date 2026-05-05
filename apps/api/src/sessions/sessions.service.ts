import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.therapySession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { therapist: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    return this.prisma.therapySession.findUnique({
      where: { id },
      include: { therapist: { include: { approach: true } }, messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async addMessage(sessionId: string, role: string, content: string) {
    const message = await this.prisma.sessionMessage.create({
      data: { sessionId, role, content },
    });
    await this.prisma.therapySession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  async submitFeedback(
    sessionId: string,
    data: { allianceRating: number; moodAfter?: number; note?: string },
  ) {
    const rating = Math.max(1, Math.min(5, Math.round(Number(data.allianceRating) || 1)));
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      select: { postMood: true },
    });

    const postMood =
      typeof session?.postMood === 'object' && session.postMood !== null && !Array.isArray(session.postMood)
        ? { ...(session.postMood as Record<string, unknown>) }
        : {};

    return this.prisma.therapySession.update({
      where: { id: sessionId },
      data: {
        allianceRating: rating,
        postMood: {
          ...postMood,
          moodAfter: typeof data.moodAfter === 'number' ? data.moodAfter : postMood.moodAfter,
          feedbackNote: data.note?.trim() || postMood.feedbackNote,
          feedbackSubmittedAt: new Date().toISOString(),
        } as any,
      },
    });
  }

  async submitMoodCheckIn(
    sessionId: string,
    data: { moodScore: number; anxietyScore?: number; stressScore?: number; note?: string },
  ) {
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      select: { postMood: true },
    });

    const postMood =
      typeof session?.postMood === 'object' && session.postMood !== null && !Array.isArray(session.postMood)
        ? { ...(session.postMood as Record<string, unknown>) }
        : {};

    return this.prisma.therapySession.update({
      where: { id: sessionId },
      data: {
        postMood: {
          ...postMood,
          selfReport: {
            moodScore: this.clampScore(data.moodScore),
            anxietyScore: typeof data.anxietyScore === 'number' ? this.clampScore(data.anxietyScore) : undefined,
            stressScore: typeof data.stressScore === 'number' ? this.clampScore(data.stressScore) : undefined,
            note: data.note?.trim() || undefined,
            submittedAt: new Date().toISOString(),
          },
        } as any,
      },
    });
  }

  async updateHomework(
    sessionId: string,
    index: number,
    data: { completed: boolean; reflection?: string },
  ) {
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      select: { homework: true },
    });

    const homework = ((session?.homework as any[]) || []).map((item) => ({ ...item }));
    if (!Number.isInteger(index) || index < 0 || index >= homework.length) {
      throw new Error('Homework item not found');
    }

    homework[index] = {
      ...homework[index],
      completed: Boolean(data.completed),
      reflection: data.reflection?.trim() || homework[index].reflection,
      completedAt: data.completed ? new Date().toISOString() : null,
    };

    return this.prisma.therapySession.update({
      where: { id: sessionId },
      data: { homework: homework as any },
    });
  }

  private clampScore(value: number) {
    return Math.max(0, Math.min(10, Math.round(Number(value) || 0)));
  }
}
