import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';

export class InternalUserLookupUserResDto extends BaseResModel<InternalUserLookupUserResDto> {
    public readonly id!: string;
    public readonly email!: string;
    public readonly fullName!: string;

    public constructor(params?: Partial<ClassParams<InternalUserLookupUserResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<InternalUserLookupUserResDto>>): InternalUserLookupUserResDto {
        return Object.assign(new InternalUserLookupUserResDto(), this, params);
    }
}

export class InternalUserLookupResDto extends BaseResModel<InternalUserLookupResDto> {
    public readonly users!: InternalUserLookupUserResDto[];

    public constructor(params?: Partial<ClassParams<InternalUserLookupResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<InternalUserLookupResDto>>): InternalUserLookupResDto {
        return Object.assign(new InternalUserLookupResDto(), this, params);
    }
}

export type InternalUserLookupUserResponseDto = InternalUserLookupUserResDto;
export type InternalUserLookupResponseDto = InternalUserLookupResDto;
