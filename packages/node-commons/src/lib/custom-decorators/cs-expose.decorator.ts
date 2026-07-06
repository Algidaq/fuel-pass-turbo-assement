import type { ExposeOptions } from 'class-transformer';
import { Expose } from 'class-transformer';
import { Allow } from 'class-validator';

export function CsExpose(options: ExposeOptions & { useAllow?: boolean }): PropertyDecorator {
    return (target, key): void => {
        if (typeof Expose === 'function') {
            Expose(options)(target, key);
        }

        if (options.useAllow) {
            Allow()(target, key);
        }
    };
}
