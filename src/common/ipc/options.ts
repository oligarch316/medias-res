import type * as options from '../../input/options';
import type * as id from '../id';

import * as channel from './channel';

export type Request = { id: id.Instance };
export type Response = options.Complete['render'];

export class Channels {
    private static _request = channel.request<Request, Response>('renderer');

    readonly request: channel.Named<typeof Channels._request>;

    constructor (prefix = 'options') {
        this.request = channel.named(`${prefix}-request`, Channels._request);
    }
}
