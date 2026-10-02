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

import type { RequestWithId } from '../logging/request-logger.middleware';
import {
  InvalidCredentialsError,
  InvalidEmailTokenError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
} from '../../../domain/auth/errors';
import { DomainError } from '../../../domain/shared/domain-error';
import {
  EmailAlreadyUsedError,
  InvalidAvatarError,
  InvalidPasswordError,
  SameEmailError,
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
  OutfitWornError,
} from '../../../domain/outfits/errors';
import {
  PastDayError,
  PlanNotFoundError,
} from '../../../domain/planning/errors';
import {
  WeatherLocationMissingError,
  WeatherUnavailableError,
} from '../../../domain/weather/errors';

const DOMAIN_ERROR_STATUS = new Map<new () => DomainError, HttpStatus>([
  [EmailAlreadyUsedError, HttpStatus.CONFLICT],
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
  [InvalidRefreshTokenError, HttpStatus.UNAUTHORIZED],
  [InvalidResetTokenError, HttpStatus.BAD_REQUEST],
  [InvalidEmailTokenError, HttpStatus.BAD_REQUEST],
  // Neutral 404: the user behind a valid token no longer exists.
  [UserNotFoundError, HttpStatus.NOT_FOUND],
  // 403, not 401: the app would take a 401 for an expired session.
  [InvalidPasswordError, HttpStatus.FORBIDDEN],
  [SameEmailError, HttpStatus.BAD_REQUEST],
  [InvalidAvatarError, HttpStatus.BAD_REQUEST],
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
  [OutfitWornError, HttpStatus.CONFLICT],
  [PlanNotFoundError, HttpStatus.NOT_FOUND],
  [PastDayError, HttpStatus.BAD_REQUEST],
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
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const { requestId } = http.getRequest<RequestWithId>();
    const body = this.toBody(exception, requestId);
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown, requestId?: string): ApiErrorBody {
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

    // The logger masks secrets that the error message might hold.
    this.logger.error(
      `Unhandled ${exception instanceof Error ? exception.name : typeof exception} [${requestId ?? 'no-request-id'}]`,
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
