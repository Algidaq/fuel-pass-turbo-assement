import type { WithAppCtx } from '@fuel-pass/node-commons';
import type { EntityManager } from 'typeorm';

export type WithEntityManager<T = unknown> = { manager: EntityManager } & WithAppCtx<T>;
