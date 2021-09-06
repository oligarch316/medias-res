import type { IpcMain, IpcMainInvokeEvent } from "electron";
import type { Id } from '../common/id';

import * as common from '../common/optionstore';

export class Store {
    private entries: Map<Id, common.Data>;

    constructor (ipc: IpcMain, channelPrefix?: string) {
        const channels = new common.Channels(channelPrefix);

        this.entries = new Map();

        channels.request.receiver(ipc)(this.handleRequest.bind(this));
    }

    private handleRequest (_: IpcMainInvokeEvent, req: common.Request): common.Response {
        const res = this.entries.get(req.id);
        if (res === undefined) throw new Error(`invalid id: ${req.id}`);
        return res;
    }

    add (id: Id, data: common.Data) {
        this.entries.set(id, data);
    }
}
