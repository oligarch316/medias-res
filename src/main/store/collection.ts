import type { IpcMain, WebContents, IpcMainInvokeEvent } from 'electron';
import type * as classified from '../../data/classified';

import * as id from '../../common/id';
import * as pre from '../../common/preiterable/async';
import * as collectionIpc from '../../common/ipc/collection';
import * as iterableIpc from '../../common/ipc/iterable';

type WebContentsId = WebContents['id'];
type IteratorMap = Map<id.Iterator, classified.Iterator>;
type Entry = {
    data: collectionIpc.ResponseGet;
    iterable: classified.Iterable;
    iterators: Map<WebContentsId, IteratorMap>;
}

export type Data = collectionIpc.ResponseGet & { iterable: classified.Iterable };

export class Store {
    private entries: Map<id.Collection, Entry>;
    private rendererTargets: Set<WebContents>;

    private collectionSenderFactory: collectionIpc.Channels['message']['sender'];

    constructor (ipc: IpcMain, instanceId: id.Instance) {
        const instanceIdStr = id.toString(instanceId);

        const collectionChannels = new collectionIpc.Channels(`${instanceIdStr}-collection`);
        const iterableChannels = new iterableIpc.Channels(`${instanceIdStr}-iterable`);

        this.entries = new Map();
        this.rendererTargets = new Set();

        this.collectionSenderFactory = collectionChannels.message.sender;

        collectionChannels.request.receiver(ipc)(this.handleCollectionRequest.bind(this));
        iterableChannels.request.receiver(ipc)(this.handleIterableRequest.bind(this));
    }

    private lookupEntry (collectionId: id.Collection) {
        const res = this.entries.get(collectionId);
        if (res === undefined) throw new Error(`invalid collection id: ${collectionId}`);
        return res;
    }

    private sendCollectionMessage (message: collectionIpc.Message) {
        for (const target of this.rendererTargets) this.collectionSenderFactory(target)(message);
    }

    // ----- Ipc request handlers
    private handleCollectionRequest (_: IpcMainInvokeEvent, req: collectionIpc.Request): collectionIpc.Response {
        switch (req.op) {
            case 'list':
                return Array.from(this.entries.keys());
            case 'get':
                return this.lookupEntry(req.id).data;
        }
    }

    private handleIterableRequest (event: IpcMainInvokeEvent, req: iterableIpc.Request) {
        const webContentsId = event.sender.id;
        const entry = this.lookupEntry(req.collectionId);

        let iteratorMap = entry.iterators.get(webContentsId);
        if (iteratorMap === undefined) {
            iteratorMap = new Map();
            entry.iterators.set(webContentsId, iteratorMap);
        }

        let iterator = iteratorMap.get(req.iteratorId);
        if (iterator === undefined) {
            iterator = entry.iterable[pre.Symbol]();
            iteratorMap.set(req.iteratorId, iterator);
        }

        switch (req.op) {
            case 'get':
                return iterator.get(req.direction);
            case 'jump':
                return iterator.jump(req.term);
        }
    }

    // ----- Renderer target operations
    addRendererTarget    (target: WebContents) { this.rendererTargets.add(target) }
    deleteRendererTarget (target: WebContents) { this.rendererTargets.delete(target) }
    clearRendererTargets ()                    { this.rendererTargets.clear() }

    // ----- Collection operations
    set (collectionId: id.Collection, data: Data) {
        const { iterable, ...entryData } = data;
        
        this.entries.set(collectionId, {
            data: entryData,
            iterable: iterable,
            iterators: new Map(),
        });
        
        this.sendCollectionMessage({ op: 'set', collectionId: collectionId });
    }

    delete (collectionId: id.Collection) {
        this.entries.delete(collectionId);
        this.sendCollectionMessage({ op: 'delete', collectionId: collectionId });
    }

    clear () {
        this.entries.clear();
        this.sendCollectionMessage({ op: 'clear' });
    }
}
