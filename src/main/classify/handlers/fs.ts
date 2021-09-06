import type * as classified from '../../../data/classified';
import type * as handler from '../handler';

import { Stats, promises as fsp } from 'fs';
import { resolve } from 'path';

export type Options = {};

export class Handler implements handler.Handler {
    constructor (private opts: Options) {}

    private static urlStringFor = (
        s: string,
        ctx: handler.Context,
    ) => `file://${resolve(ctx.workingDirectory, s)}`;

    private handleFIFO (path: string, ctx: handler.Context): classified.Recursable {
        // TODO
        // https://stackoverflow.com/questions/44982499/read-from-a-named-pipe-fifo-with-node-js/46965930
        // https://stackoverflow.com/questions/52608586/node-js-fs-open-hangs-after-trying-to-open-more-than-4-named-pipes-fifos/52622722#52622722

        throw new Error(`fs FIFO support not yet implemented: ${path}`);
    }

    private handleFile = (path: string, ctx: handler.Context): classified.FSItem => ({
        protocol: 'fs',
        type: 'file',
        urlString: Handler.urlStringFor(path, ctx),
    });

    private handleDirectory = (path: string, ctx: handler.Context): classified.FSItem => ({
        protocol: 'fs',
        type: 'directory',
        urlString: Handler.urlStringFor(path, ctx),
    });

    async handle (raw: string, ctx: handler.Context) {
        let stats: Stats;
        try { stats = await fsp.stat(raw) } catch (e) { return undefined }

        if (stats.isFIFO())      return this.handleFIFO(raw, ctx);
        if (stats.isFile())      return this.handleFile(raw, ctx);
        if (stats.isDirectory()) return this.handleDirectory(raw, ctx);
    }
}
