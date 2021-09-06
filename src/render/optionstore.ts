import type { IpcRenderer } from 'electron';
import type { Id } from '../common/id';

import * as common from '../common/optionstore';

export class Store {
    private sendRequest: ReturnType<common.Channels['request']['sender']>

    constructor (ipc: IpcRenderer, channelPrefix?: string) {
        const channels = new common.Channels(channelPrefix);
        this.sendRequest = channels.request.sender(ipc);
    }

    get = (id: Id): Promise<common.Data> => this.sendRequest({ id: id });
}
