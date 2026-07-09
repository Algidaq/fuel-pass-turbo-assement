import { getAppRuntimeConfig } from './app.config';

export const configs = {
    app: getAppRuntimeConfig,
};

export const envs = {
    app: configs.app(),
};
