// @ts-check
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '..');
const api = path.join(root, 'apps', 'api');
const web = path.join(root, 'apps', 'web');
const rootEnvExamplePath = path.join(root, '.env.example');
const envs = dotenv.config({ path: rootEnvExamplePath });
const rootEnvEntries = Object.entries(envs.parsed ?? {}).map(([key, value]) => ({ key, value }));

const serviceMappings = [
    {
        name: 'auth-service',
        prefix: 'AUTH-',
        path: path.join(api, 'auth-service'),
    },
    {
        name: 'orders-service',
        prefix: 'ORDERS-',
        path: path.join(api, 'orders-service'),
    },
    {
        name: 'proxy-service',
        prefix: 'PROXY-',
        path: path.join(api, 'proxy-service'),
    },
    {
        name: 'web-app',
        prefix: 'WEB-',
        path: path.join(web, 'web-app'),
    },
];
/**
 *
 * @param {string} prefix
 * @returns
 */
function collectEnvEntries(prefix) {
    return rootEnvEntries.filter(({ key }) => key.startsWith(prefix)).map(({ key, value }) => ({ key: key.slice(prefix.length), value }));
}

/**
 * @param {Array<{key:string,value:string}>} entries
 * @returns {string}
 */
function serializeEnvEntries(entries) {
    return entries.map(({ key, value }) => `${key}=${value}`).join('\n') + '\n';
}

for (const serviceMapping of serviceMappings) {
    const serviceEnvs = collectEnvEntries(serviceMapping.prefix);

    if (serviceEnvs.length === 0) {
        throw new Error(`No env values found for ${serviceMapping.name} with prefix ${serviceMapping.prefix}`);
    }

    const targetPath = path.join(serviceMapping.path, '.env');
    fs.writeFileSync(targetPath, serializeEnvEntries(serviceEnvs));

    console.log(`Generated ${path.relative(root, targetPath)} from ${path.relative(root, rootEnvExamplePath)}`);
}
