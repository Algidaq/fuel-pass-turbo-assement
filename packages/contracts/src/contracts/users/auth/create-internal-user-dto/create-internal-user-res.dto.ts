import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';
import type { AuthUserContextDto } from '../auth.contracts';

export class CreateInternalUserResDto extends BaseResModel<CreateInternalUserResDto> {
    public readonly user!: AuthUserContextDto;

    public constructor(params?: Partial<ClassParams<CreateInternalUserResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<CreateInternalUserResDto>>): CreateInternalUserResDto {
        return Object.assign(new CreateInternalUserResDto(), this, params);
    }
}

export type CreateInternalUserResponseDto = CreateInternalUserResDto;
