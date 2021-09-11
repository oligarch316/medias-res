import type * as collection from '../../data/collection';
import type * as context from '../../input/context';
import type * as id from '../id';

import * as channel from './channel';

export type MessageSet = { op: 'set', collectionId: id.Collection };
export type MessageDelete = { op: 'delete', collectionId: id.Collection };
export type MessageClear = { op: 'clear' };
export type Message = MessageSet | MessageDelete | MessageClear;

export type RequestList = { op: 'list' };
export type RequestGet = { op: 'get'; id: id.Collection };
export type Request = RequestList | RequestGet;

export type ResponseList = id.Collection[];
export type ResponseGet = { info: collection.Info, ctx: context.Complete['render'] };
export type Response = ResponseList | ResponseGet;

export class Channels {
    private static _message = channel.fire<Message>('main');
    private static _request = channel.request<Request, Response>('renderer');

    readonly message: channel.Named<typeof Channels._message>;
    readonly request: channel.Named<typeof Channels._request>;

    constructor (prefix = 'collection') {
        this.message = channel.named(`${prefix}-message`, Channels._message);
        this.request = channel.named(`${prefix}-request`, Channels._request);
    }
}
