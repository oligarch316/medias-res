import type * as mime from './mime';
import * as pre from '../common/preiterable/async';

export type ItemInfo = {
    readonly id: symbol;
    readonly name: string;
    readonly shortname?: string;
};

export type ItemData = {
    buffer: Buffer;
    mime: mime.Data;
};

export interface Item extends ItemInfo { data (): Promise<ItemData> };
export type Iterable = pre.Iterable<Item>;
export type Iterator = pre.Iterator<Item>;
export type Recursable = pre.HeteroRecursable<Item>;
export type Recursor = pre.HeteroRecursor<Item>;

export const isRecursable = (x: Item | Recursable): x is Recursable => pre.isHeteroRecursable<Item>(x);
