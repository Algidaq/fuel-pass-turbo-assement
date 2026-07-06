import path from 'node:path';
import { IS_DEV } from '../helpers';
import type { BaseApiHeaders } from '../models';

export function constructLogMsg(filePath: string, fnName: string, headers?: BaseApiHeaders): string {
    const _filename = /\.{ts,js}/.test(filePath) ? path.basename(filePath, IS_DEV ? '.ts' : '.js') : filePath;

    if (!headers) {
        return `${_filename}::${fnName}`;
    }

    const { urc, grc } = headers;

    return `${_filename}::${fnName}::urc::${urc}::grc::${grc}`;
}

export function constructErrorMsg(filePath: string, fnName: string, headers?: BaseApiHeaders): string {
    const msg = constructLogMsg(filePath, fnName, headers);
    return `ERROR::${msg}`;
}
