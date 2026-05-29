import { Response } from 'express';
import { ApiResponse, PaginationMeta } from './types';

export function ok<T>(res: Response, data: T, message?: string): Response {
  return res.status(200).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return res.status(201).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
): Response {
  return res.status(200).json({ success: true, data, meta } satisfies ApiResponse<T[]>);
}
