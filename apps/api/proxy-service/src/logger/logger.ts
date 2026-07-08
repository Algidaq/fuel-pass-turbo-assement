import { createPinoAppLogger, type PinoAppLogger } from '@fuel-pass/node-commons';
import { envs } from '../configs/config';

export const logger: PinoAppLogger = createPinoAppLogger({
    level: envs.app.logLevel,
    pretty: envs.app.logPretty,
    service: 'proxy-service',
});
