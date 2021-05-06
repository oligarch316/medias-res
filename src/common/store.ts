import type { IpcMainInvokeEvent, IpcRendererEvent } from 'electron';
import { Term, Direction, Result } from './preiterable/sync';
import type { Item } from './data';

import * as ipc from './ipc';

// ----- Id

export type Id = number;
export type IdFactory = Generator<Id, never, undefined>;

export function* genIds (): IdFactory {
    for (let i = 0; ; i++) yield i;
}


// ----- Operation

export type OpSet    = { op: 'set'; iterableIds: Id[] };
export type OpDelete = { op: 'delete'; iterableIds: Id[] };
export type OpClear  = { op: 'clear' };

export type OperationMessage = OpSet | OpDelete | OpClear;

export type OperationSender  = (message: OperationMessage) => void;
export type OperationHandler = (event: IpcRendererEvent, message: OperationMessage) => void;


// ----- Item

export type ItemIds = { iterableId: Id; iteratorId: Id };
export type ItemGet  = ItemIds & { action: 'get'; direction: Direction };
export type ItemJump = ItemIds & { action: 'jump'; term: Term };

export type ItemRequest  = ItemGet | ItemJump;
export type ItemResponse = Result<Item> | void;

export type ItemSender  = (req: ItemRequest) => Promise<ItemResponse>;
export type ItemHandler = (event: IpcMainInvokeEvent, req: ItemRequest) => ItemResponse | Promise<ItemResponse>;


// ----- Channels

export class Channels {
    private static _operation = ipc.fire<OperationMessage>('main');
    private static _item = ipc.request<ItemRequest, ItemResponse>('renderer');

    readonly operation: ipc.NamedChannel<typeof Channels._operation>;
    readonly item: ipc.NamedChannel<typeof Channels._item>;

    constructor (prefix = 'store') {
        this.operation = ipc.named(`${prefix}-operation`, Channels._operation);
        this.item = ipc.named(`${prefix}-item`, Channels._item);
    }
}
