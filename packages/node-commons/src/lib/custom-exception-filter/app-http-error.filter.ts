import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../helpers';
import { AppHttpError } from '../standard-errors';
@Catch(AppHttpError)
export class AppHttpErrorExceptionFilter implements ExceptionFilter<AppHttpError<any>> {
    public catch(exception: AppHttpError<any>, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        const appRes = ApiResponse.fromAppError(exception);

        response.status(appRes.status).json(appRes.data);
    }
}
