import { DynamicModule, FactoryProvider, Module } from '@nestjs/common';

export interface CoreAuthModuleOptions {
    readonly internalAuthBaseUrl: string;
    readonly internalServiceApiKey: string;
    readonly introspectionTimeoutMs: number;
}

export interface CoreAuthModuleAsyncOptions<TFactoryArgs extends readonly unknown[] = readonly unknown[]> {
    readonly imports?: DynamicModule['imports'];
    readonly inject?: FactoryProvider['inject'];
    readonly useFactory: (...args: TFactoryArgs) => CoreAuthModuleOptions | Promise<CoreAuthModuleOptions>;
}

export const CORE_AUTH_MODULE_OPTIONS = Symbol('CORE_AUTH_MODULE_OPTIONS');

@Module({})
export class CoreAuthModule {
    public static forRoot(options: CoreAuthModuleOptions): DynamicModule {
        return {
            module: CoreAuthModule,
            providers: [
                {
                    provide: CORE_AUTH_MODULE_OPTIONS,
                    useValue: options,
                },
            ],
            exports: [CORE_AUTH_MODULE_OPTIONS],
        };
    }

    public static forRootAsync<TFactoryArgs extends readonly unknown[]>(options: CoreAuthModuleAsyncOptions<TFactoryArgs>): DynamicModule {
        return {
            module: CoreAuthModule,
            imports: options.imports,
            providers: [
                {
                    provide: CORE_AUTH_MODULE_OPTIONS,
                    inject: options.inject,
                    useFactory: options.useFactory,
                },
            ],
            exports: [CORE_AUTH_MODULE_OPTIONS],
        };
    }
}
