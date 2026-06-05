
import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import * as crypto from 'crypto';

@Injectable()
export class FingerprintThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'anonymous';
    return crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex');
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: `Too many essay review requests. Please wait ${Math.ceil(throttlerLimitDetail.timeToExpire)} seconds before trying again.`,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
