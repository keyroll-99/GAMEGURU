import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url, body } = request;
    const now = Date.now();

    // Log request details (be careful with sensitive data in body in production)
    // For development, it's useful to see the body (maybe sanitize password)
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    
    this.logger.log(`Incoming Request: ${method} ${url} ${JSON.stringify(sanitizedBody)}`);

    return next
      .handle()
      .pipe(
        tap((data) => {
             const response = ctx.getResponse();
             const delay = Date.now() - now;
             this.logger.log(`Response for ${method} ${url} - Status: ${response.statusCode} - ${delay}ms`);
        }),
      );
  }
}
