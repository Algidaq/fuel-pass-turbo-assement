import { DataSource } from 'typeorm';
import { getTypeOrmModuleOptions } from './typeorm.config';

const options = getTypeOrmModuleOptions();

export default new DataSource({
    ...options,
});
