import type * as data from '../data';

import * as pre from '../../common/preiterable/async';
import * as sizeable from '../../common/sizeable';
import * as mime from '../mime';

export type LoadedData = {
    mime: mime.Data;
    size: number;
    objectURL: string;
};

export type LoadedItem = data.ItemInfo & LoadedData;

export type Handler = (item: data.Item) => Promise<LoadedData>;
export type Loader = (iterable: pre.Iterable<data.Item>) => pre.Iterable<LoadedItem>;

export async function handleBasic (item: data.Item): Promise<LoadedData> {
    const itemData = await item.data();
    const blb = new Blob(
        [itemData.buffer],
        { type: mime.toString(itemData.mime) },
    );

    return {
        mime: itemData.mime,
        size: blb.size,
        objectURL: URL.createObjectURL(blb),
    };
}

export function loadBasic (iterable: pre.Iterable<data.Item>, id?: string | symbol) {
    return new LoadIterable(iterable, item => handleBasic(item), id);
}

export class Cache {
    private cache: sizeable.LRUCache<symbol, LoadedData>;

    constructor (size: number) { this.cache = new sizeable.LRUCache(size) }

    async handle (item: data.Item): Promise<LoadedData> {
        let res = this.cache.get(item.id);
        if (res === undefined) {
            res = await handleBasic(item);
            this.cache.set(item.id, res);
        }
        return res;
    }

    load (iterable: pre.Iterable<data.Item>, id?: string | symbol) {
        return new LoadIterable(iterable, item => this.handle(item), id);
    }
}

class LoadIterator extends pre.IteratorBase<LoadedItem> {
    constructor (
        private iterator: pre.Iterator<data.Item>,
        private handler: Handler,
    ) { super() }

    get size () { return this.iterator.size }

    jump (term: pre.Term) { return this.iterator.jump(term) }

    async get (direction: pre.Direction): pre.Result<LoadedItem> {
        const res = await this.iterator.get(direction);
        if (res.done) return res;

        const itemInfo = { id: res.value.id, name: res.value.name, shortName: res.value.shortName };
        const itemData = await this.handler(res.value);

        return {
            done: false,
            value: { ...itemInfo, ...itemData },
        };
    }
}

class LoadIterable extends pre.IterableBase<LoadedItem> {
    constructor (
        private iterable: pre.Iterable<data.Item>,
        private handler: Handler,
        id?: string | symbol,
    ) { super(id) }

    protected build () { return new LoadIterator(this.iterable[pre.Symbol](), this.handler) }
}
