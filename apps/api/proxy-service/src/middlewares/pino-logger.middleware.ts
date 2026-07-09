import { createPinoHttpMiddleware } from '@fuel-pass/node-commons';
import type { RequestHandler } from 'express';
import { logger } from '../logger/logger';

export const pinoLoggerMiddleware: RequestHandler = createPinoHttpMiddleware({ logger: logger.pino });
