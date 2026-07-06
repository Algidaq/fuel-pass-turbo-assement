import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';

export class RefreshResDto extends BaseResModel<RefreshResDto> {
    public readonly accessToken!: string;
    public readonly refreshToken!: string;
    public readonly expiresIn!: number;
    public readonly tokenType!: 'Bearer';

    public constructor(params?: Partial<ClassParams<RefreshResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<RefreshResDto>>): RefreshResDto {
        return Object.assign(new RefreshResDto(), this, params);
    }

    public override toJSON(): Record<string, any> {
        return {
            access_token: this.accessToken,
            refresh_token: this.refreshToken,
            expires_in: this.expiresIn,
            token_type: this.tokenType,
        };
    }
}

export type RefreshResponseDto = RefreshResDto;
