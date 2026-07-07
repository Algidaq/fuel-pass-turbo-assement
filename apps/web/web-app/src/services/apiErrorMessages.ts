import { AUTH_ERRORS, ORDER_ERRORS, type ErrorDefinition, type ErrorDefinitionValue } from '@fuel-pass/contracts';

import { isApiError, type ApiError } from './httpClient';

type BackendError = {
  code?: unknown;
};

type BackendErrorPayload = {
  errors?: unknown;
};

type ApiErrorMessageOptions = {
  codeMessages?: Record<string, string>;
};

const isErrorDefinitionArray = (value: ErrorDefinitionValue): value is readonly ErrorDefinition[] => Array.isArray(value);

const toErrorDefinitions = (value: ErrorDefinitionValue): readonly ErrorDefinition[] => (isErrorDefinitionArray(value) ? value : [value]);

const catalogMessages = [...Object.values(AUTH_ERRORS), ...Object.values(ORDER_ERRORS)].reduce<Record<string, string>>(
  (messages, value) => {
    for (const definition of toErrorDefinitions(value)) {
      messages[definition.code] = definition.message;
    }

    return messages;
  },
  {},
);

const getFirstErrorCode = (error: ApiError): string | undefined => {
  if (typeof error.details !== 'object' || error.details === null || !('errors' in error.details)) {
    return undefined;
  }

  const errors = (error.details as BackendErrorPayload).errors;
  const firstError = Array.isArray(errors) ? (errors[0] as BackendError | undefined) : undefined;

  return typeof firstError?.code === 'string' && firstError.code.trim().length > 0 ? firstError.code : undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string, options: ApiErrorMessageOptions = {}): string => {
  if (!isApiError(error)) {
    return fallback;
  }

  const code = getFirstErrorCode(error);
  if (code) {
    return options.codeMessages?.[code] ?? catalogMessages[code] ?? error.message;
  }

  return error.message;
};
