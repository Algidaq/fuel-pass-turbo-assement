import { config } from 'dotenv';
import { resolve } from 'node:path';

const envFilePath = resolve(__dirname, '../.env.test');

config({ path: envFilePath });
