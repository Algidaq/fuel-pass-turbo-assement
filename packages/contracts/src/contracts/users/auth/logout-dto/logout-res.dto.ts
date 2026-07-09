import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';

export class LogoutResDto extends BaseResModel<LogoutResDto> {
    public readonly success!: true;

    public constructor(params?: Partial<ClassParams<LogoutResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<LogoutResDto>>): LogoutResDto {
        return Object.assign(new LogoutResDto(), this, params);
    }
}

export type LogoutResponseDto = LogoutResDto;
