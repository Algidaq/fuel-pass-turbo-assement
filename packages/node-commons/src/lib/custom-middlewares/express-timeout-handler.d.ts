declare module 'express-timeout-handler' {
    import { RequestHandler } from 'express';

    export interface TimeoutOptions {
        timeout?: number;
        onTimeout?: (req: any, res: any, next: any) => void;
        disable?: string[];
        onDelayedResponse?: (req: any, method: string, args: any[], elapsed: number) => void;
    }

    export function handler(options?: TimeoutOptions): RequestHandler;
    export function set(timeout: number): RequestHandler;
}
