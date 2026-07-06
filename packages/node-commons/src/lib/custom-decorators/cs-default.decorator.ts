import { Transform } from 'class-transformer';

export function CsDefault<T = unknown>(value: T, options?: { key: string }): PropertyDecorator {
    return (target, key): void => {
        return Transform(
            (params): T => {
                return params.obj[options?.key ?? key] ?? value;
            },
            { toClassOnly: true }
        )(target, key);
    };
}
