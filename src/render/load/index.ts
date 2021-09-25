import type * as parsed from '../../data/parsed';
import type * as loaded from '../../data/loaded';
import type * as options from './options';
import type * as context from './context';

import * as pre from '../../common/preiterable/async';
import * as sizeable from '../../common/sizeable';
import * as mime from '../../data/mime';
import * as filter from './filter';

export type Options = options.Complete;
export type Context = context.Complete;

export class Loader {
    private dataLoader: DataLoader;

    constructor (private opts: Options) {
        this.dataLoader = (opts.cacheSize > 0)
            ? cachedDataLoader(opts.cacheSize)
            : basicDataLoader;
    }

    handle = async (item: parsed.Item): Promise<loaded.Item> => ({
        id: item.id,
        name: item.name,
        shortname: item.shortname,
        ...await this.dataLoader(item),
    });

    load (input: parsed.Iterable, ctx: Context): loaded.Iterable {
        const filterFunc = filter.merge(...ctx.filters);
        const iterable = new pre.TransformedIterable(input, item => this.handle(item));
        return pre.FilteredIterable.from(iterable, filterFunc);
    }
}

type DataLoader = (item: parsed.Item) => Promise<loaded.ItemData>;

const basicDataLoader: DataLoader = async (item) => {
    const parsedData = await item.data();
    const blb = new Blob(
        [parsedData.buffer],
        { type: mime.toString(parsedData.mime) },
    );

    return {
        mime: parsedData.mime,
        size: blb.size,
        objectURL: URL.createObjectURL(blb),
    };
}

const cachedDataLoader = (size: number): DataLoader => {
    const cache = new sizeable.LRUCache<symbol, loaded.ItemData>(size);
    
    return async (item) => {
        let res = cache.get(item.id);
        if (res === undefined) {
            res = await basicDataLoader(item);
            cache.set(item.id, res);
        }
        return res;
    }
}
