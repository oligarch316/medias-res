import type * as pre from '../common/preiterable/sync';
import type * as collection from '../data/collection';
import type * as classified from '../data/classified';
import type * as context from '../input/context';

import * as ipc from './ipc';

// TODO: Replace with import * as id from './id';
// ----- Id
export type Id = number;
export type EntryId = Id;
export type IteratorId = Id;

export type IdFactory = Generator<Id, never, undefined>;

export function* genIds (): IdFactory {
    for (let i = 0; ; i++) yield i;
}

// ----- Seed metadata
// TODO: ctx may need to be OutputOf<context.Complete>['render']
// to avoid ipc issues with function objects, not sure yet...
export type SeedMeta = { info: collection.Info, ctx: context.Complete['render'] };

// ----- Operations
// Fire-and-forget messages | Main -> Renderer 
export type MessageSet    = { op: 'set'; entryId: Id };
export type MessageDelete = { op: 'delete'; entryId: Id };
export type MessageClear  = { op: 'clear' };
export type Message = MessageSet | MessageDelete | MessageClear;

export type MessageOps = Message['op'];
export type MessageFor<T extends MessageOps> = Extract<Message, { op: T }>;

// Request-response | Renderer -> Main
export type ActionGet = { action: 'get'; direction: pre.Direction };
export type ActionJump = { action: 'jump'; term: pre.Term };
export type Action = ActionGet | ActionJump;

export type RequestList = { op: 'list' };
export type RequestGet = { op: 'get'; entryId: Id };
export type RequestPerform = { op: 'perform'; entryId: Id; iteratorId: Id } & Action;
export type Request = RequestList | RequestGet | RequestPerform;

export type ResponseList = Id[];
export type ResponseGet = SeedMeta;
export type ResponsePerform = pre.Result<classified.Item> | void;
export type Response = ResponseList | ResponseGet | ResponsePerform;

export type RequestOps = Request['op'];
export type RequestFor<T extends RequestOps> = Extract<Request, { op: T }>;

// ----- Channels
export class Channels {
    private static _message = ipc.fire<Message>('main');
    private static _request = ipc.request<Request, Response>('renderer');

    readonly message: ipc.NamedChannel<typeof Channels._message>;
    readonly request: ipc.NamedChannel<typeof Channels._request>;

    constructor (prefix = 'store') {
        this.message = ipc.named(`${prefix}-message`, Channels._message);
        this.request = ipc.named(`${prefix}-request`, Channels._request);
    }
}
