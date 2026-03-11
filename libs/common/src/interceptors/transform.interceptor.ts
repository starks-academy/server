import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    path: string;
    [key: string]: any;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        // If data already has the envelope shape, pass it through
        if (data && data.success !== undefined) return data;

        return {
          success: true,
          data: data?.data !== undefined ? data.data : data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(data?.meta || {}),
          },
        };
      }),
    );
  }
}
