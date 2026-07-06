import { CsExpose } from '../custom-decorators';
import type { ClassParams } from '../helpers/utility-types.helpers';
import { BaseApiHeaders } from './base-api-headers.model';

export class AuthApiHeaders extends BaseApiHeaders {
    @CsExpose({ name: 'authorization' })
    public readonly authorization: string;

    public constructor(params: Partial<AuthApiHeaders> = {}) {
        super(params);
        this.authorization = params.authorization ?? '';
    }

    public override copyWith(params: Partial<ClassParams<AuthApiHeaders>>): AuthApiHeaders {
        return Object.assign(new AuthApiHeaders(), this, params);
    }
}

export class InternalAuthApiHeaders extends AuthApiHeaders {
    @CsExpose({ name: 'x-internal-api-key' })
    public readonly xInternalApiKey: string;

    public constructor(params: Partial<InternalAuthApiHeaders> = {}) {
        super(params);
        this.xInternalApiKey = params.xInternalApiKey ?? '';
    }

    public override copyWith(params: Partial<ClassParams<InternalAuthApiHeaders>>): InternalAuthApiHeaders {
        return Object.assign(new InternalAuthApiHeaders(), this, params);
    }
}
