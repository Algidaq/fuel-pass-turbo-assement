import { envs } from './configs/config';
import { logger } from './logger/logger';
import { createServer } from './server/server';

const application = createServer(envs.app);

application.listen(envs.app.port, (): void => {
    logger.info(
        {
            port: envs.app.port,
            services: envs.app.services.map((service): string => service.namespace),
        },
        'Proxy service started'
    );
});
