import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'object' && responseBody !== null) {
        message = (responseBody as any).message || responseBody;
        error = (responseBody as any).error || 'Error';
      } else {
        message = responseBody;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma Error Handling
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        error = 'Not Found';
      } else {
        message = exception.message.replace(/\n/g, '');
        error = 'Database Error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
    );
    if (exception instanceof Error) {
      this.logger.debug(exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: error,
      message: message,
    });
  }
}
