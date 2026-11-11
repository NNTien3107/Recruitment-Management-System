import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

function isPaginated(data: unknown): data is { items: unknown[]; meta: unknown } {
  return typeof data === 'object' && data !== null && 'items' in data && 'meta' in data;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (isPaginated(data)) {
          return { success: true, data: data.items, meta: data.meta };
        }
        return { success: true, data: data ?? null };
      }),
    );
  }
}
