import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';
import type { AuthUserContextDto } from '../auth.contracts';

export class CurrentUserResDto extends BaseResModel<CurrentUserResDto> {
    public readonly user!: AuthUserContextDto;

    public constructor(params?: Partial<ClassParams<CurrentUserResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<CurrentUserResDto>>): CurrentUserResDto {
        return Object.assign(new CurrentUserResDto(), this, params);
    }
}

export type CurrentUserResponseDto = CurrentUserResDto;
