import { IsIP, IsNumber, IsString, MinLength } from 'class-validator';
import { CsDefault, CsExpose } from '../custom-decorators';
import { ExcludeKeys, toPlainWithExclusion } from '../helpers/class-transformer.helpers';
import type { ClassParams } from '../helpers/utility-types.helpers';

export class BaseApiHeaders {
    @CsExpose({ name: 'x-client-ip' })
    @IsIP('4', { message: 'please provide x-client-ip header' })
    public readonly clientIp: string;

    @CsExpose({ name: 'unique-reference-code' })
    @IsString({ message: 'please provide unique-reference-code header' })
    @MinLength(3)
    public readonly urc: string;

    @CsExpose({ name: 'global-reference-code' })
    @IsString({ message: 'please provide global-reference-code header' })
    @MinLength(3)
    public readonly grc: string;

    @CsExpose({ name: 'user-agent' })
    @IsString({ message: 'please provide user-agent header' })
    @MinLength(3)
    public readonly userAgent: string;

    @CsExpose({ name: 'client-timestamp' })
    @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 }, { message: 'please provide a valid client-timestamp header' })
    public readonly clientTimestamp: string;

    @CsExpose({ name: 'accept-language' })
    @CsDefault('en')
    public readonly language!: string;

    @CsExpose({ name: 'origin' })
    @IsString({ message: 'please provide a valid origin header' })
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
