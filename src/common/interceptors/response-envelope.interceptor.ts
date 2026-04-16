import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ResponseEnvelope<T> {
  status: string;
  code: number;
  data: T;
  pagination?: PaginationMeta;
}

function isPaginatedShape(data: any): data is { items: any[]; total: number; page?: number; limit?: number } {
  return (
    data !== null &&
    typeof data === 'object' &&
    'items' in data &&
    'total' in data &&
    Array.isArray(data.items)
  );
}

function buildPagination(currentPage: number, limit: number, total: number): PaginationMeta {
  return {
    currentPage,
    itemsPerPage: limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        const statusCode: number = response.statusCode ?? 200;
        
        // Pass through if error or already wrapped
        if (statusCode >= 400 || (data && data.status && data.code)) {
          return data;
        }

        // Handle paginated shape
        if (isPaginatedShape(data)) {
          const page = Number(data.page ?? request.query?.page ?? 1);
          const limit = Number(data.limit ?? request.query?.limit ?? 10);
          return {
            status: 'success',
            code: statusCode,
            data: data.items as T,
            pagination: buildPagination(page, limit, data.total),
          };
        }

        // Handle arrays
        if (Array.isArray(data)) {
          return {
            status: 'success',
            code: statusCode,
            data,
          };
        }

        // Default wrap
        return {
          status: 'success',
          code: statusCode,
          data: data ?? null,
        };
      }),
    );
  }
}
