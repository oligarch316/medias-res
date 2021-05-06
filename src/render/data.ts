import type * as mime from './mime';

import * as pre from '../common/preiterable/async';

export type ItemInfo = {
    readonly id: symbol;
    readonly name: string;
    readonly shortName?: string;
};

export type ItemData = {
    buffer: Buffer;
    mime: mime.Data;
};
    
export interface Item extends ItemInfo { data (): Promise<ItemData> }
export type Seed = pre.HeteroRecursable<Item>;
export * as common from '../common/data';
