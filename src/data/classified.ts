import * as pre from '../common/preiterable/async';

export type FSItem = {
    readonly protocol:  'fs';
    readonly type:      'file' | 'directory';
    readonly urlString: string;
};

export type HTTPItem = {
    readonly protocol:  'http';
    readonly urlString: string;
};

export type HTTPSItem = {
    readonly protocol: 'https';
    readonly urlString: string;
}

export type Item = FSItem | HTTPItem | HTTPSItem;

export type Protocol = Item['protocol'];
export type ItemFor<P extends Protocol> = Extract<Item, { protocol: P }>;

export type Iterable = pre.Iterable<Item>;
export type Iterator = pre.Iterator<Item>;
export type Recursable = pre.HeteroRecursable<Item>;
export type Recursor = pre.HeteroRecursor<Item>;

export const isRecursable = (x: Item | Recursable): x is Recursable => pre.isHeteroRecursable<Item>(x);
