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

function isPaginatedShape(
  data: unknown,
): data is { items: unknown[]; total: number; page?: number; limit?: number } {
  return (
    data !== null &&
    typeof data === 'object' &&
    'items' in data &&
    'total' in data &&
    Array.isArray((data as { items: unknown[] }).items)
  );
}

function buildPagination(
  currentPage: number,
  limit: number,
  total: number,
): PaginationMeta {
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
        if (statusCode >= 400) {
          return data;
        }

        // Prevent double wrapping
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'code' in data
        ) {
          return data;
        }

        // Handle Paginated Shape
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

        // Handle Array (auto-pagination)
        if (Array.isArray(data)) {
          const page = Math.max(1, Number(request.query?.page ?? 1));
          const limit = Math.max(
            1,
            Number(request.query?.limit ?? data.length || 10),
          );
          return {
            status: 'success',
            code: statusCode,
            data,
            pagination: buildPagination(page, limit, data.length),
          };
        }

        // Handle Null/Empty
        if (data === null || data === undefined) {
          return {
            status: 'success',
            code: statusCode,
            data: null as T,
          };
        }

        // Default Single Object
        return {
          status: 'success',
          code: statusCode,
          data,
        };
      }),
    );
  }
}
