import type * as mime from './mime';
import type * as parsed from './parsed';
import * as pre from '../common/preiterable/async';

export { ItemInfo } from './parsed';

export type ItemData = {
    readonly mime: mime.Data;
    readonly size: number; // TODO: Type w/ units included?
    readonly objectURL: string;
}

export type Item = parsed.ItemInfo & ItemData;

export type Iterable = pre.Iterable<Item>;
export type Iterator = pre.Iterator<Item>;
export type Recursable = pre.HeteroRecursable<Item>;
export type Recursor = pre.HeteroRecursor<Item>;

export const isRecursable = (x: Item | Recursable): x is Recursable => pre.isHeteroRecursable<Item>(x);
