import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let code: string | undefined;
    const error = exception instanceof Error ? exception.name : 'Error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      message = res?.message || res;
      code = res?.code;
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'INTERNAL_ERROR';
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
