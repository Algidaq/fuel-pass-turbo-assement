import { instanceToPlain } from 'class-transformer';
import { omit } from 'lodash';
export type ExcludeKeys<T> = Partial<Record<keyof T, boolean>>;

export function toPlainWithExclusion<T>(instance: T, excludeKeys?: ExcludeKeys<T>): Record<string, string> {
    const plain = instanceToPlain(instance, { excludeExtraneousValues: true, exposeDefaultValues: true });

    if (!excludeKeys) {
        return plain;
    }

    const propertiesToOmit = Object.entries(excludeKeys)
        .filter(([_key, value]: [string, unknown]): boolean => value as boolean)
        .map(([key, _]): string => key);

    return omit(plain, propertiesToOmit);
}
