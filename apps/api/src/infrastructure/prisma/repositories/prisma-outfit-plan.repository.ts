import { Injectable } from '@nestjs/common';
import type { WeatherCondition } from '@klotho/shared';

import type {
  NewOutfitPlan,
  OutfitPlanRepository,
  PlanForecast,
  StoredOutfitPlan,
} from '../../../domain/planning/ports/outfit-plan.repository';
import type { OutfitPlan as OutfitPlanRow } from '../../../generated/prisma/client';
import { isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

/** A DATE column comes back as midnight UTC. */
const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const dateOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

const forecastData = (forecast: PlanForecast | null) => ({
  forecastTemperature: forecast?.temperature ?? null,
  forecastCondition: forecast?.condition ?? null,
});

// Values were validated (shared schemas, weather provider) before being stored.
const toPlan = (row: OutfitPlanRow): StoredOutfitPlan => ({
  id: row.id,
  userId: row.userId,
  outfitId: row.outfitId,
  day: dayOf(row.day),
  forecast:
    row.forecastTemperature !== null && row.forecastCondition !== null
      ? {
          temperature: row.forecastTemperature,
          condition: row.forecastCondition as WeatherCondition,
        }
      : null,
});

@Injectable()
export class PrismaOutfitPlanRepository implements OutfitPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listBetween(
    userId: string,
    from: string,
    to: string,
  ): Promise<StoredOutfitPlan[]> {
    const rows = await this.prisma.outfitPlan.findMany({
      where: { userId, day: { gte: dateOf(from), lte: dateOf(to) } },
      orderBy: { day: 'asc' },
    });
    return rows.map(toPlan);
  }

  async findByDay(
    userId: string,
    day: string,
  ): Promise<StoredOutfitPlan | null> {
    const row = await this.prisma.outfitPlan.findUnique({
      where: { userId_day: { userId, day: dateOf(day) } },
    });
    return row && toPlan(row);
  }

  async save(userId: string, plan: NewOutfitPlan): Promise<StoredOutfitPlan> {
    const upsert = () =>
      this.prisma.outfitPlan.upsert({
        where: { userId_day: { userId, day: dateOf(plan.day) } },
        create: {
          userId,
          outfitId: plan.outfitId,
          day: dateOf(plan.day),
          ...forecastData(plan.forecast),
        },
        update: { outfitId: plan.outfitId, ...forecastData(plan.forecast) },
      });
    try {
      return toPlan(await upsert());
    } catch (error) {
      // Two plans of the same day at once: the first created it, replace it.
      if (!isUniqueViolation(error)) throw error;
      return toPlan(await upsert());
    }
  }

  async createMany(
    userId: string,
    plans: NewOutfitPlan[],
  ): Promise<StoredOutfitPlan[]> {
    if (plans.length === 0) return [];
    const rows = await this.prisma.outfitPlan.createManyAndReturn({
      data: plans.map((plan) => ({
        userId,
        outfitId: plan.outfitId,
        day: dateOf(plan.day),
        ...forecastData(plan.forecast),
      })),
      skipDuplicates: true,
    });
    return rows.map(toPlan).sort((a, b) => a.day.localeCompare(b.day));
  }

  async move(
    userId: string,
    from: string,
    to: string,
    forecasts: { from: PlanForecast | null; to: PlanForecast | null },
  ): Promise<StoredOutfitPlan[]> {
    return this.prisma.$transaction(async (tx) => {
      const find = (day: string) =>
        tx.outfitPlan.findUnique({
          where: { userId_day: { userId, day: dateOf(day) } },
        });
      const moved = await find(from);
      if (!moved) return [];
      const swapped = await find(to);
      // One plan per day: the other one leaves its day first.
      if (swapped) await tx.outfitPlan.delete({ where: { id: swapped.id } });
      const rows = [
        await tx.outfitPlan.update({
          where: { id: moved.id },
          data: { day: dateOf(to), ...forecastData(forecasts.to) },
        }),
      ];
      if (swapped) {
        rows.push(
          await tx.outfitPlan.create({
            data: {
              id: swapped.id,
              userId,
              outfitId: swapped.outfitId,
              day: dateOf(from),
              createdAt: swapped.createdAt,
              ...forecastData(forecasts.from),
            },
          }),
        );
      }
      return rows.map(toPlan);
    });
  }

  async delete(userId: string, day: string): Promise<void> {
    await this.prisma.outfitPlan.deleteMany({
      where: { userId, day: dateOf(day) },
    });
  }
}
