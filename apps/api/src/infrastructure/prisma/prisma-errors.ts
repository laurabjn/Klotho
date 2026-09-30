import { Prisma } from '../../generated/prisma/client';

function hasCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

export const isUniqueViolation = (error: unknown) => hasCode(error, 'P2002');
export const isRecordNotFound = (error: unknown) => hasCode(error, 'P2025');
