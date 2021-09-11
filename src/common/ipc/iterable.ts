import type * as classified from '../../data/classified';
import type * as pre from '../preiterable/sync';
import type * as id from '../id';

import * as channel from './channel';

type RequestIds = { collectionId: id.Collection, iteratorId: id.Iterator };
export type RequestGet = RequestIds & { op: 'get', direction: pre.Direction };
export type RequestJump = RequestIds & { op: 'jump', term: pre.Term };
export type Request = RequestGet | RequestJump;

export type ResponseGet = pre.Result<classified.Item>;
export type ResponseJump = void;
export type Response = ResponseGet | ResponseJump;

export class Channels {
    private static _request = channel.request<Request, Response>('renderer');

    readonly request: channel.Named<typeof Channels._request>;

    constructor (prefix = 'iterable') {
        this.request = channel.named(`${prefix}-request`, Channels._request);
    }
}
