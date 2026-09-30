import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  type AuthSession,
  type AuthTokens,
  type ForgotPasswordInput,
  type LoginInput,
  type LogoutInput,
  type RefreshTokenInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@klotho/shared';

import { ForgotPasswordUseCase } from '../../../application/auth/forgot-password.use-case';
import { LoginUseCase } from '../../../application/auth/login.use-case';
import { LogoutUseCase } from '../../../application/auth/logout.use-case';
import { RefreshTokenUseCase } from '../../../application/auth/refresh-token.use-case';
import { RegisterUseCase } from '../../../application/auth/register.use-case';
import { ResetPasswordUseCase } from '../../../application/auth/reset-password.use-case';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';
import { Public } from './public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
  ): Promise<AuthSession> {
    return this.registerUseCase.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
  ): Promise<AuthSession> {
    return this.loginUseCase.execute(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<AuthTokens> {
    return this.refreshUseCase.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Body(new ZodValidationPipe(logoutSchema)) body: LogoutInput,
  ): Promise<void> {
    return this.logoutUseCase.execute(body);
  }

  /** Always 202, whether the email exists or not. */
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    body: ForgotPasswordInput,
  ): Promise<void> {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
  ): Promise<void> {
    return this.resetPasswordUseCase.execute(body);
  }
}
