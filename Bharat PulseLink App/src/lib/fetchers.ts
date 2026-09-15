import api from '../services/api';
import { z } from 'zod';

/**
 * Lightweight typed fetcher helpers.
 *
 * NOTE: Do NOT invent actual backend contracts here. These helpers provide
 * a boundary for future Zod schemas and typed fetchers; concrete schemas
 * will be added once provider artifacts exist.
 */

export async function fetchAndValidate<T>(promise: Promise<any>, schema: z.ZodType<T>): Promise<T> {
  const res = await promise;
  const payload = res && typeof res === 'object' && 'data' in res ? res.data : res;
  return schema.parse(payload);
}

export function getValidated<T>(url: string, schema: z.ZodType<T>, config?: any) {
  return fetchAndValidate(api.get(url, config), schema);
}

export function postValidated<T>(url: string, body: any, schema: z.ZodType<T>, config?: any) {
  return fetchAndValidate(api.post(url, body, config), schema);
}

export default { fetchAndValidate, getValidated, postValidated };
