import type * as context from '../context';
import type * as options from '../options';

import * as codec from '../../common/codec';
import * as filters from '../../filters';
import * as log from '../../main/log/options';
import * as meta from '../meta';

import * as either from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter'
import { readFileSync } from 'fs';

const Config = codec.partial({
    cacheSize: codec.partial({
        classify: codec.number,
        load: codec.number,
        parse: codec.number,
    }),
    display: codec.partial({
        height: codec.number,
        width: codec.number,
    }),
    filters: codec.array(filters.Options), // TODO: Make "set-like"
    log: log.Incomplete,
    mode: meta.Mode,
    recurse: codec.boolean,
});

type Config = codec.TypeOf<typeof Config>;

function encodeFilters (fs: Config['filters']) {
    const res: {
        classified: filters.classified.Options[],
        loaded: filters.loaded.Options[],
        parsed: filters.parsed.Options[],
    } = { classified: [], parsed: [], loaded: [] };

    if (fs === undefined) return res;

    function tryDecode<C extends codec.Any> (u: unknown, c: C, list: codec.TypeOf<C>[]) {
        const res = c.decode(u);
        if (either.isRight(res)) list.push(res.right);
    }

    for (const f of fs) {
        tryDecode(f, filters.classified.Options, res.classified);
        tryDecode(f, filters.loaded.Options, res.loaded);
        tryDecode(f, filters.parsed.Options, res.parsed);
    }

    return res;
}

function encodeMeta (config: Config): meta.Meta {
    return { mode: config.mode };
}

function encodeContext (config: Config): context.Incomplete {
    const filterSet = encodeFilters(config.filters);

    return {
        main: {
            classify: { filters: filterSet.classified },
        },
        render: {
            parse: {
                filters: filterSet.parsed,
                recurse: config.recurse,
            },
            load: { filters: filterSet.loaded },
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
