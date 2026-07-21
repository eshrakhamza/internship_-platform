import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      let status: number;
      let message: string | object;
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        message = typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : (exceptionResponse as any).message || exception.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
      }
  
      this.logger.error(
        `Exception: ${JSON.stringify({
          statusCode: status,
          message,
          path: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
        })}`,
        exception instanceof Error ? exception.stack : '',
      );
  
      response.status(status).json({
        statusCode: status,
        message: Array.isArray(message) ? message : [message],
        error: HttpStatus[status],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }