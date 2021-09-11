import type * as context from '../context';
import type * as meta from '../meta';
import type * as options from '../options';

import { app } from 'electron';
import { resolve } from 'path';

// TODO: Consider (this.app.isPackaged) ? 'prod' : 'dev';
const defaultMode: meta.Mode = 'prod';

const defaultConfigPaths: { [K in meta.Mode]: string } = {
    dev: resolve(app.getAppPath(), 'config.json'),
    prod: resolve(app.getPath('userData'), 'config.json'),
} as const;

export const configPath = (m: meta.Meta) => (m.configPath === undefined)
    ? defaultConfigPaths[m.mode ?? defaultMode]
    : m.configPath;

export type LoadResult = {
    ctx: context.Complete,
    opts: options.Complete,
};

export function load (m: meta.Meta): LoadResult {
    const context: context.Complete = {
        main: {
            classify: {
                workingDirectory: '',
                filters: [],
            },
        },
        render: {
            load: { filters: [] },
            parse: {
                recurse: false,
                filters: [],
            },
        },
    };

    const opts: options.Complete = {
        main: {
            pane: {
                height: 600,
                width: 800,
            },
            classify: { cacheSize: 0 },
            log: {
                level: (m.mode === 'dev') ? 'debug' : 'warn',
                format: 'json',
                output: 'stderr',
            },
            newInstance: false,
        },
        render: {
            pane: {
                info: { mediaMode: 'short' },
                view: { imageMode: 'fixed' },
            },
            parse: { cacheSize: 0 },
            load: { cacheSize: 0 },
        },
    };
    
    return { ctx: context, opts: opts };
}
