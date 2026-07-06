export const IS_DEV = getOsEnv('NODE_ENV') === 'development';
export const IS_PROD = getOsEnv('NODE_ENV') === 'production';

export function toBool(value: string): boolean {
    return value.toLowerCase() === 'true';
}

export function toInt(value: string): number {
    return parseInt(value, 10);
}

export function toNumber(value: string): number {
    return Number(value);
}

export function jsonSafeParse<T = unknown>(input: string): [T, null] | [null, Error] {
    try {
        const parsedJson = JSON.parse(input);
        return [parsedJson, null];
    } catch (error: unknown) {
        return [null, error as Error];
    }
}

export function getOsEnv(key: string, _default?: string): string | undefined {
    return process.env[key] ?? _default;
}

export function getOsEnvNumber(key: string, _default: number): number {
    return toNumber(getOsEnv(key) ?? `${_default}`);
}

export function getOsEnvRegex(key: string): RegExp | boolean {
    const value = getOsEnv(key);

    if (!value) {
        return false;
    }

    const regex = new RegExp(value.slice(1, -1));

    return regex;
}

export function getOsEnvBoolean(key: string, _default: boolean): boolean {
    const env = getOsEnv(key);

    if (!env) {
        return _default;
    }

    return toBool(env);
}

export function getOsEnvArray(key: string, delimiter: string = ','): string[] {
    const env = getOsEnv(key);

    if (!env || !env.includes(delimiter)) {
        return [];
    }

    return env.split(delimiter);
}

export function getOsEnvObj<T = unknown>(key: string): ReturnType<typeof jsonSafeParse<T>> {
    return jsonSafeParse(getOsEnv(key) ?? '{}');
}
