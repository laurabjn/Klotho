import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ApiErrorBody } from '@klotho/shared';
import type { z } from 'zod';

/** Validates and transforms a request part with a zod schema (shared with the mobile app). */
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<
  unknown,
  z.output<S>
> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const body: ApiErrorBody = {
        statusCode: 400,
        code: 'validation.failed',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
      throw new BadRequestException(body);
    }
    return result.data;
  }
}
