import type { IpcMain, IpcMainInvokeEvent } from "electron";
import type * as id from '../../common/id';
import type * as options from '../../input/options';

import * as optionsIpc from '../../common/ipc/options';

export class Store {
    private entries: Map<id.Instance, options.Complete>;

    constructor (ipc: IpcMain, channelPrefix?: string) {
        const channels = new optionsIpc.Channels(channelPrefix);

        this.entries = new Map();

        channels.request.receiver(ipc)(this.handleRequest.bind(this));
    }

    private handleRequest (_: IpcMainInvokeEvent, req: optionsIpc.Request): optionsIpc.Response {
        const opts = this.entries.get(req.id);
        if (opts === undefined) throw new Error(`invalid instance id: ${req.id}`);
        return opts.render;
    }

    add (instanceId: id.Instance, opts: options.Complete) {
        this.entries.set(instanceId, opts);
    }
}
