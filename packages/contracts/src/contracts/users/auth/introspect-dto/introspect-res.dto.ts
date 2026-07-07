import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';
import type { AuthUserContextDto } from '../auth.contracts';

export class IntrospectResDto extends BaseResModel<IntrospectResDto> {
    public readonly active!: boolean;
    public readonly sub?: string;
    public readonly sessionId?: string;
    public readonly email?: string;
    public readonly roles?: string[];
    public readonly permissions?: string[];
    public readonly user?: AuthUserContextDto;

    public constructor(params?: Partial<ClassParams<IntrospectResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<IntrospectResDto>>): IntrospectResDto {
        return Object.assign(new IntrospectResDto(), this, params);
    }
}
