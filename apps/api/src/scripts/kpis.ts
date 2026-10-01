// Prints the beta KPIs (aggregates only, nothing personal):
//   npm run kpis -w @klotho/api [-- --json]
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { computeKpis, formatKpis } from '../application/analytics/kpis';
import {
  KPI_SOURCE,
  type KpiSource,
} from '../domain/analytics/ports/kpi-source';
import { CLOCK, type Clock } from '../domain/shared/ports/clock';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const today = app.get<Clock>(CLOCK).now();
    const report = computeKpis(
      await app.get<KpiSource>(KPI_SOURCE).collect(today),
    );
    const day = today.toISOString().slice(0, 10);
    console.log(
      process.argv.includes('--json')
        ? JSON.stringify({ day, ...report }, null, 2)
        : `Klotho KPIs, ${day}\n\n${formatKpis(report)}`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
