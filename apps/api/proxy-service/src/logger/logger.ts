import { PinoAppLogger } from '@fuel-pass/node-commons';
import { envs } from '../configs/config';

export const logger: PinoAppLogger = PinoAppLogger.init({
    level: envs.app.logLevel,
    pretty: envs.app.logPretty,
    service: 'proxy-service',
});
