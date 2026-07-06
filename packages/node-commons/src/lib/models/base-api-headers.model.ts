import { CsDefault, CsExpose } from '../custom-decorators';
import { ExcludeKeys, toPlainWithExclusion } from '../helpers/class-transformer.helpers';
import type { ClassParams } from '../helpers/utility-types.helpers';

export class BaseApiHeaders {
    @CsExpose({ name: 'x-client-ip' })
    public readonly clientIp: string;

    @CsExpose({ name: 'unique-reference-code' })
    public readonly urc: string;

    @CsExpose({ name: 'global-reference-code' })
    public readonly grc: string;

    @CsExpose({ name: 'user-agent' })
    public readonly userAgent: string;

    @CsExpose({ name: 'client-timestamp' })
    public readonly clientTimestamp: string;

    @CsExpose({ name: 'accept-language' })
    @CsDefault('en')
    public readonly language!: string;

    @CsExpose({ name: 'origin' })
    public readonly origin!: string;

    public constructor(params: Partial<BaseApiHeaders> = {}) {
        this.clientIp = params.clientIp ?? '';
        this.urc = params.urc ?? '';
        this.grc = params.grc ?? '';
        this.userAgent = params.userAgent ?? '';
        this.clientTimestamp = params.clientTimestamp ?? '';
        this.language = params.language ?? 'en';
        this.origin = params.origin ?? '';
    }

    public toPlain(keysToExclude: ExcludeKeys<BaseApiHeaders> = { toPlain: true }): Record<string, unknown> {
        return toPlainWithExclusion<BaseApiHeaders>(this, keysToExclude);
    }

    public copyWith(params: Partial<ClassParams<BaseApiHeaders>>): BaseApiHeaders {
        return Object.assign(new BaseApiHeaders(), this, params);
    }
}
