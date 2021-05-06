import type * as data from '../data';

import * as pre from '../../common/preiterable/async';
import { handle as handleHTTP } from './http';
import { handle as handleFS } from './fs';

export type Handler = (raw: data.common.Item) => Promise<data.Item | data.Seed>;
export type Parser = (raw: pre.Iterable<data.common.Item>) => data.Seed;

export async function handleBasic (raw: data.common.Item) {
    switch (raw.protocol) {
        case 'http':
        case 'https':
           return handleHTTP(raw);
        case 'fs':
            return handleFS(raw);
    }
}

export function parseBasic (raw: pre.Iterable<data.common.Item>, id?: string | symbol) {
    return new ParseIterable(raw, item => handleBasic(item), id);
}

class ParseIterator extends pre.IteratorBase<data.Item | data.Seed> {
    constructor (
        private iterator: pre.Iterator<data.common.Item>,
        private handler: Handler,
    ) { super() }

    get size () { return this.iterator.size }

    jump (term: pre.Term) { return this.iterator.jump(term) }

    async get (direction: pre.Direction): pre.Result<data.Item | data.Seed> {
        const res = await this.iterator.get(direction);
        return (res.done) ? res : { done: false, value: await this.handler(res.value) };
    }
}

class ParseIterable extends pre.IterableBase<data.Item | data.Seed> {
    constructor (
        private iterable: pre.Iterable<data.common.Item>,
        private handler: Handler,
        id?: string | symbol,
    ) { super(id) }

    protected build() { return new ParseIterator(this.iterable[pre.Symbol](), this.handler) }
}
