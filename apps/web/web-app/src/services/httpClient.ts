import { env } from '../config/env';
import { useAuthStore } from '../features/auth/store/auth.store';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

type BackendError = {
  code?: string;
  message?: string;
  details?: unknown;
};

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = env.apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (text.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === 'object' && payload !== null && 'errors' in payload) {
    const errors = (payload as { errors?: BackendError[] }).errors;
    const firstError = Array.isArray(errors) ? errors[0] : undefined;

    return firstError?.message ?? firstError?.code ?? fallback;
  }

  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find((item): item is string => typeof item === 'string' && item.trim().length > 0);

      return firstMessage ?? fallback;
    }
  }

  return fallback;
};

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null && 'status' in error && 'message' in error;

export const httpClient = async <TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> => {
  const accessToken = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);
  const hasJsonBody = options.body !== undefined;

  if (hasJsonBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
      body: hasJsonBody ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    throw {
      status: 0,
      message: 'Unable to reach the server. Check your connection and try again.',
      details: error instanceof Error ? error.message : error,
    } satisfies ApiError;
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw {
      status: response.status,
      message: getErrorMessage(payload, 'Request failed. Please try again.'),
      details: payload,
    } satisfies ApiError;
  }

  return payload as TResponse;
};
