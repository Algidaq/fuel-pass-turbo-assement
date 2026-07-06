export type ExtractUnionType<T extends object> = T[keyof T];

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type NonFnKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type ClassParams<Class> = Pick<Class, NonFnKeys<Class>>;
