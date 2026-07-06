import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';
import type { AuthUserContextDto } from '../auth.contracts';

export class LoginResDto extends BaseResModel<LoginResDto> {
    public readonly accessToken!: string;

    public readonly refreshToken!: string;
    public readonly expiresIn!: number;
    public readonly tokenType!: 'Bearer';
    public readonly user!: AuthUserContextDto;
    public constructor(params?: Partial<ClassParams<LoginResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<LoginResDto>>): LoginResDto {
        return Object.assign(new LoginResDto(), this, params);
    }

    public override toJSON(): Record<string, any> {
        return {
            access_token: this.accessToken,
            refresh_token: this.refreshToken,
            expires_in: this.expiresIn,
            token_type: this.tokenType,
            user: this.user,
        };
    }
}
