import type * as data from '../data';
import type { Parser } from './parser';

import { Stats, promises as fsp } from 'fs';
import { resolve } from 'path';

export class Handler {
    private static itemURL = (path: string) => encodeURI(`file://${resolve(path)}`);
    
    private static file = (path: string): data.common.FSItem => ({
        protocol: 'fs',
        type: 'file',
        urlString: Handler.itemURL(path),
    });
    
    private static directory = (path: string): data.common.FSItem => ({
        protocol: 'fs',
        type: 'directory',
        urlString: Handler.itemURL(path),
    });

    constructor (private fifoParser?: Parser) {}

    private handleFIFO (path: string): data.Seed | undefined {
        if (this.fifoParser === undefined) return undefined;

        // TODO
        // https://stackoverflow.com/questions/44982499/read-from-a-named-pipe-fifo-with-node-js/46965930
        // https://stackoverflow.com/questions/52608586/node-js-fs-open-hangs-after-trying-to-open-more-than-4-named-pipes-fifos/52622722#52622722
        throw new Error(`fs FIFO support not yet implemented: ${path}`);
    }

    async handle (raw: string) {
        let stats: Stats;
        try { stats = await fsp.stat(raw) } catch (e) { return undefined }

        if (stats.isFIFO())      return this.handleFIFO(raw);
        if (stats.isFile())      return Handler.file(raw);
        if (stats.isDirectory()) return Handler.directory(raw);
    }
}
