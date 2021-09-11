import type { IpcRenderer } from 'electron';
import type * as id from '../../common/id';

import * as optionsIpc from '../../common/ipc/options';

export class Store {
    private sendRequest: ReturnType<optionsIpc.Channels['request']['sender']>;

    constructor (ipc: IpcRenderer, channelPrefix?: string) {
        const channels = new optionsIpc.Channels(channelPrefix);
        this.sendRequest = channels.request.sender(ipc);
    }

    get = (instanceId: id.Instance) => this.sendRequest({ id: instanceId });
}
