import { DynamicModule, Global, Module } from '@nestjs/common';
import { STANDARD_ERROR_OPTIONS, StandardErrorOptions, StandardErrorRegistry } from './standard-error.registry';
import { ErrorCatalog } from './standard-error.types';

@Global()
@Module({})
export class StandardErrorModule {
    public static forRoot(options: StandardErrorOptions = {}): DynamicModule {
        return {
            module: StandardErrorModule,
            providers: [
                {
                    provide: STANDARD_ERROR_OPTIONS,
                    useValue: options,
                },
                StandardErrorRegistry,
            ],
            exports: [StandardErrorRegistry],
        };
    }

    public static forFeature(options: { namespace: string; catalog: ErrorCatalog }): DynamicModule {
        const providerToken = Symbol(`STANDARD_ERROR_CATALOG:${options.namespace}`);

        return {
            module: StandardErrorModule,
            providers: [
                {
                    provide: providerToken,
                    inject: [StandardErrorRegistry],
                    useFactory: (registry: StandardErrorRegistry): boolean => {
                        registry.register(options.namespace, options.catalog);
                        return true;
                    },
                },
            ],
        };
    }
}
