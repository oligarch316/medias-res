import type * as context from '../context';
import type * as options from '../options';

import * as codec from '../codec';
import * as log from '../../main/log/options';
import * as meta from '../meta';

import { either } from 'fp-ts';
import { PathReporter } from 'io-ts/PathReporter'
import { readFileSync } from 'fs';

const cacheSizeConfig = codec.memoized.mergedFrom(
    codec.cachesize.primitive,
    codec.cachesize.compound,
    'priorityBase',
    'CacheSizeConfig',
);

const displayConfig = codec.partial({
    height: codec.number,
    width: codec.number,
}, 'DisplayConfig');

const filtersConfig = codec.memoized.mergedFrom(
    codec.filter.primitive,
    codec.filter.compound,
    'priorityBase',
    'FilterConfig',
);

const Config = codec.partial({
    // Meta
    mode: meta.Mode,

    // Context
    filters: filtersConfig,
    recurse: codec.boolean,

    // Options
    cacheSize: cacheSizeConfig,
    display: displayConfig,
    log: log.Incomplete,
}, 'Config');

type Config = codec.TypeOf<typeof Config>;

function encodeMeta (config: Config): meta.Meta {
    return { mode: config.mode };
}

function encodeContext (config: Config): context.Incomplete {
    return {
        main: {
            classify: {
                filters: config.filters?.classify,
            }
        },
        render: {
            parse: {
                filters: config.filters?.parse,
                recurse: config.recurse,
            },
            load: {
                filters: config.filters?.load,
            },
        },
    };
}

function encodeOptions (config: Config): options.Incomplete {
    return {
        main: {
            classify: { cacheSize: config.cacheSize?.classify },
            pane: {
                height: config.display?.height,
                width: config.display?.width,
            },
            log: config.log,
        },
        render: {
            load: { cacheSize: config.cacheSize?.load },
            parse: { cacheSize: config.cacheSize?.parse },
        },
    };
}

export type LoadResult = {
    ctx: context.Incomplete,
    meta: meta.Meta,
    opts: options.Incomplete,
};

const jsonFilterNullReviver = (_: string, v: any) => v === null ? undefined : v;

const loadData = (configPath: string) => {
    try {
        return readFileSync(configPath)
    } catch (e) {
        return undefined;
    }
};

const loadJSON = (data: Buffer) => JSON.parse(
    data.toString(),
    jsonFilterNullReviver,
);

export function load (configPath: string): LoadResult {
    const rawData = loadData(configPath);
    if (rawData === undefined) return { ctx: {}, meta: {}, opts: {} };

    const jsonData = loadJSON(rawData);
    const eitherConfig = Config.decode(jsonData);

    if (either.isLeft(eitherConfig)) {
        // TODO: Error handling/messaging
        throw new Error(PathReporter.report(eitherConfig).join(' | '));
    }

    return {
        ctx: encodeContext(eitherConfig.right),
        meta: encodeMeta(eitherConfig.right),
        opts: encodeOptions(eitherConfig.right),
    };
}
