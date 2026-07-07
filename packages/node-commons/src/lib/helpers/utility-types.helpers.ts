import type { BaseApiHeaders } from '../models';

export type ExtractUnionType<T extends object> = T[keyof T];

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type NonFnKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type ClassParams<Class> = Pick<Class, NonFnKeys<Class>>;

export type OptionalNullables<T> = { [K in keyof T]: T[K] extends null ? T[K] : T[K] };

export type WithHeaders<T = unknown, Headers extends BaseApiHeaders = BaseApiHeaders> = T & { headers: Headers };

export type WithAppCtx<T = unknown, Headers extends BaseApiHeaders = BaseApiHeaders> = WithHeaders<T, Headers>;
