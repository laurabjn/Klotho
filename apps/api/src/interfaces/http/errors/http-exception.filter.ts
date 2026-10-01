import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody } from '@klotho/shared';
import type { Response } from 'express';

import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
} from '../../../domain/auth/errors';
import { DomainError } from '../../../domain/shared/domain-error';
import {
  EmailAlreadyUsedError,
  UserNotFoundError,
} from '../../../domain/users/errors';
import {
  InvalidImageError,
  UploadNotFoundError,
} from '../../../domain/storage/errors';
import {
  InvalidTemperatureRangeError,
  PhotoLimitReachedError,
  WardrobeItemNotFoundError,
  WardrobePhotoNotFoundError,
} from '../../../domain/wardrobe/errors';
import {
  ImposedItemNotFoundError,
  ImposedItemUnavailableError,
  InvalidReplacementError,
  NoOutfitPossibleError,
  OutfitNotFoundError,
  OutfitWearNotFoundError,
} from '../../../domain/outfits/errors';
import {
  WeatherLocationMissingError,
  WeatherUnavailableError,
} from '../../../domain/weather/errors';

const DOMAIN_ERROR_STATUS = new Map<new () => DomainError, HttpStatus>([
  [EmailAlreadyUsedError, HttpStatus.CONFLICT],
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
  [InvalidRefreshTokenError, HttpStatus.UNAUTHORIZED],
  [InvalidResetTokenError, HttpStatus.BAD_REQUEST],
  // Neutral 404: the user behind a valid token no longer exists.
  [UserNotFoundError, HttpStatus.NOT_FOUND],
  [WardrobeItemNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidTemperatureRangeError, HttpStatus.BAD_REQUEST],
  [WardrobePhotoNotFoundError, HttpStatus.NOT_FOUND],
  [PhotoLimitReachedError, HttpStatus.CONFLICT],
  [InvalidImageError, HttpStatus.UNSUPPORTED_MEDIA_TYPE],
  [UploadNotFoundError, HttpStatus.BAD_REQUEST],
  [WeatherUnavailableError, HttpStatus.SERVICE_UNAVAILABLE],
  [WeatherLocationMissingError, HttpStatus.UNPROCESSABLE_ENTITY],
  [OutfitNotFoundError, HttpStatus.NOT_FOUND],
  [OutfitWearNotFoundError, HttpStatus.NOT_FOUND],
  [NoOutfitPossibleError, HttpStatus.UNPROCESSABLE_ENTITY],
  [InvalidReplacementError, HttpStatus.BAD_REQUEST],
  [ImposedItemNotFoundError, HttpStatus.BAD_REQUEST],
  [ImposedItemUnavailableError, HttpStatus.CONFLICT],
]);

const HTTP_STATUS_CODE: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'request.invalid',
  [HttpStatus.UNAUTHORIZED]: 'auth.unauthorized',
  [HttpStatus.FORBIDDEN]: 'auth.forbidden',
  [HttpStatus.NOT_FOUND]: 'request.notFound',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'uploads.tooLarge',
  [HttpStatus.TOO_MANY_REQUESTS]: 'request.tooMany',
};

/** Every error leaves the API as an ApiErrorBody; internals are logged, never returned. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof DomainError) {
      const status = DOMAIN_ERROR_STATUS.get(
        exception.constructor as new () => DomainError,
      );
      if (status !== undefined)
        return { statusCode: status, code: exception.code };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      if (isApiErrorBody(payload)) return payload;
      return {
        statusCode,
        code: HTTP_STATUS_CODE[statusCode] ?? 'request.failed',
      };
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'server.error',
    };
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'statusCode' in value
  );
}
