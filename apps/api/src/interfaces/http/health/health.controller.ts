import type { HealthResponse } from '@klotho/shared';
import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
