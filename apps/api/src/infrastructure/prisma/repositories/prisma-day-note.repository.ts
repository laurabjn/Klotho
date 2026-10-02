import { Injectable } from '@nestjs/common';

import type { DayNoteRepository } from '../../../domain/planning/ports/day-note.repository';
import { isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

const dateOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

@Injectable()
export class PrismaDayNoteRepository implements DayNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: string, day: string): Promise<string | null> {
    const row = await this.prisma.dayNote.findUnique({
      where: { userId_day: { userId, day: dateOf(day) } },
      select: { text: true },
    });
    return row?.text ?? null;
  }

  async save(userId: string, day: string, text: string | null): Promise<void> {
    if (text === null) {
      await this.prisma.dayNote.deleteMany({
        where: { userId, day: dateOf(day) },
      });
      return;
    }
    const upsert = () =>
      this.prisma.dayNote.upsert({
        where: { userId_day: { userId, day: dateOf(day) } },
        create: { userId, day: dateOf(day), text },
        update: { text },
      });
    try {
      await upsert();
    } catch (error) {
      // Saved twice at once: the first created it, update it.
      if (!isUniqueViolation(error)) throw error;
      await upsert();
    }
  }
}
