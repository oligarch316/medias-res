import type { IpcMain, WebContents, IpcMainInvokeEvent } from 'electron';
import type * as classified from '../data/classified';

import * as pre from '../common/preiterable/async';
import * as common from '../common/store';

type WebContentsId = number;

type IteratorMap = Map<common.IteratorId, classified.Iterator>;
type Entry = {
    meta: common.SeedMeta;
    seed: classified.Iterable;
    iterators: Map<WebContentsId, IteratorMap>;
};

export class Store {
    private symbols: Map<symbol, common.EntryId>;
    private entries: Map<common.EntryId, Entry>;
    private rendererTargets: Set<WebContents>;

    private idFactory: common.IdFactory;
    private messagerFactory: common.Channels['message']['sender'];

    constructor (ipc: IpcMain, channelPrefix?: string) {
        const channels = new common.Channels(channelPrefix);

        this.symbols = new Map();
        this.entries = new Map();
        this.rendererTargets = new Set();

        this.idFactory = common.genIds();
        this.messagerFactory = channels.message.sender;

        channels.request.receiver(ipc)(this.handleRequest.bind(this));
    }

    private lookupEntry (entryId: common.EntryId) {
        const entry = this.entries.get(entryId);
        if (entry === undefined) throw new Error(`invalid entry id: ${entryId}`);
        return entry;
    }

    private sendMessage (message: common.Message) {
        for (const target of this.rendererTargets) this.messagerFactory(target)(message);
    }

    private handleRequest (event: IpcMainInvokeEvent, req: common.Request) {
        switch (req.op) {
            case 'list':
                return this.handleRequestList(event, req);
            case 'get':
                return this.handleRequestGet(event, req);
            case 'perform':
                return this.handleRequestPerform(event, req);
        }
    }

    private handleRequestList (event: IpcMainInvokeEvent, req: common.RequestList): common.ResponseList {
        return Array.from(this.entries.keys());
    }

    private handleRequestGet (event: IpcMainInvokeEvent, req: common.RequestGet): common.ResponseGet {
        return this.lookupEntry(req.entryId).meta;
    }
    
    private handleRequestPerform (event: IpcMainInvokeEvent, req: common.RequestPerform): Promise<common.ResponsePerform> {
        const webContentsId = event.sender.id
        const entry = this.lookupEntry(req.entryId);
        
        let iteratorMap = entry.iterators.get(webContentsId);
        if (iteratorMap === undefined) {
            iteratorMap = new Map();
            entry.iterators.set(webContentsId, iteratorMap);
        }

        let iterator = iteratorMap.get(req.iteratorId);
        if (iterator === undefined) {
            iterator = entry.seed[pre.Symbol]();
            iteratorMap.set(req.iteratorId, iterator);
        }

        return (req.action === 'get')
            ? iterator.get(req.direction)
            : iterator.jump(req.term);
    }

    addRendererTarget    (target: WebContents) { this.rendererTargets.add(target) }
    deleteRendererTarget (target: WebContents) { this.rendererTargets.delete(target) }
    clearRendererTargets ()                    { this.rendererTargets.clear() }

    set (seed: classified.Iterable, meta: common.SeedMeta) {
        let entryId = this.symbols.get(seed.id);
        if (entryId === undefined) {
            entryId = this.idFactory.next().value;
            this.symbols.set(seed.id, entryId);
        }

        this.entries.set(entryId, {
            meta: meta,
            seed: seed,
            iterators: new Map(),
        });

        this.sendMessage({ op: 'set', entryId: entryId });
    }
    
    delete (id: symbol) {
        const entryId = this.symbols.get(id);
        if (entryId === undefined) return;

        this.entries.delete(entryId);
        this.symbols.delete(id);

        this.sendMessage({ op: 'delete', entryId: entryId });
    }

    clear () {
        this.entries.clear();
        this.symbols.clear();

        this.sendMessage({ op: 'clear' });
    }
}
