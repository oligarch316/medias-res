import type * as options from '../input/options';
import type * as id from './id';

import * as ipc from './ipc';

export type Data = options.Complete['render'];

export type Request = { id: id.Id };
export type Response = Data;

export class Channels {
    private static _request = ipc.request<Request, Response>('renderer');

    readonly request: ipc.NamedChannel<typeof Channels._request>;

    constructor (prefix = 'pane') {
        this.request = ipc.named(`${prefix}-request`, Channels._request);
    }
}
