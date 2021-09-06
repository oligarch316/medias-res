import type { IpcRenderer, IpcRendererEvent } from 'electron';
import type * as classified from '../data/classified';

import * as pre from '../common/preiterable/async';
import * as common from '../common/store';
import { EventEmitter } from 'events';

type RequestClient = (req: common.Request) => Promise<common.Response>;

export type ChangeEventSet =    { op: 'set', id: symbol };
export type ChangeEventDelete = { op: 'delete', id: symbol };
export type ChangeEventClear =  { op: 'clear' };

export type ChangeEvent = ChangeEventSet | ChangeEventDelete | ChangeEventClear;
export type ChangeListener = (event: ChangeEvent) => void;

export { SeedMeta } from '../common/store';
export type SeedData = {
    meta: common.SeedMeta;
    iterable: classified.Iterable;
};

export class Store {
    private static messageEventName = 'message-event';

    private symbols: Map<symbol, common.EntryId>;
    private seeds: Map<common.EntryId, classified.Iterable>;
    private messageEmitter: EventEmitter;
    private requestClient: RequestClient;

    constructor (ipc: IpcRenderer, channelPrefix?: string) {
        const channels = new common.Channels(channelPrefix);

        this.symbols = new Map();
        this.seeds = new Map();
        this.messageEmitter = new EventEmitter();
        this.requestClient = channels.request.sender(ipc);

        channels.message.receiver(ipc)(this.handleMessage.bind(this));
    }

    private sendRequest (req: common.RequestList): Promise<common.ResponseList>;
    private sendRequest (req: common.RequestGet): Promise<common.ResponseGet>;
    private sendRequest (req: common.Request) { return this.requestClient(req) }

    private handleMessage (event: IpcRendererEvent, message: common.Message) {
        let change: ChangeEvent | undefined;
        switch (message.op) {
            case 'set':
                change = this.handleMessageSet(event, message);
                break;
            case 'delete':
                change = this.handleMessageDelete(event, message);
                break;
            case 'clear':
                change = this.handleMessageClear(event, message);
                break;
        }
        if (change !== undefined) this.messageEmitter.emit(Store.messageEventName, change);
    }

    private handleMessageSet (event: IpcRendererEvent, message: common.MessageSet): ChangeEvent {
        const existingSeedId = this.seeds.get(message.entryId)?.id;
        const seed = new IpcIterable(message.entryId, this.requestClient, existingSeedId);
        
        this.seeds.set(message.entryId, seed);
        this.symbols.set(seed.id, message.entryId);

        return { op: 'set', id: seed.id };
    }

    private handleMessageDelete (event: IpcRendererEvent, message: common.MessageDelete): ChangeEvent | undefined {
        const seed = this.seeds.get(message.entryId);
        if (seed === undefined) return undefined;

        this.seeds.delete(message.entryId);
        this.symbols.delete(seed.id);

        return { op: 'delete', id: seed.id };
    }

    private handleMessageClear (event: IpcRendererEvent, message: common.MessageClear): ChangeEvent {
        this.seeds.clear();
        this.symbols.clear();

        return { op: 'clear' };
    }

    addChangeListener (listener: ChangeListener) {
        this.messageEmitter.addListener(Store.messageEventName, listener);
    }

    deleteChangeListener (listener: ChangeListener) {
        this.messageEmitter.removeListener(Store.messageEventName, listener);
    }
    
    clearChangeListeners () {
        this.messageEmitter.removeAllListeners(Store.messageEventName);
    }

    async list () {
        const entryIds = await this.sendRequest({ op: 'list' });
        for (const entryId of entryIds) {
            if (this.seeds.has(entryId)) continue;

            const seed = new IpcIterable(entryId, this.requestClient);
            this.seeds.set(entryId, seed);
            this.symbols.set(seed.id, entryId);
        }

        return Array.from(this.symbols.keys());
    }

    async get (id: symbol): Promise<SeedData> {
        const entryId = this.symbols.get(id);
        if (entryId === undefined) throw new Error(`invalid id: ${id.toString()}`);

        const seed = this.seeds.get(entryId);
        if (seed === undefined) throw new Error(`internal error: no seed found for symbol: ${id.toString()} / entry id: ${entryId}`);

        return {
            meta: await this.sendRequest({ op: 'get', entryId: entryId }),
            iterable: seed,
        }
    }
}

class IpcIterable extends pre.IterableBase<classified.Item> implements classified.Iterable {
    private iteratorIdFactory: common.IdFactory;

    constructor (
        private entryId: common.EntryId,
        private client: RequestClient,
        id: string | symbol = 'renderer.ipcIterable'
    ) {
        super(id);
        this.iteratorIdFactory = common.genIds();
    }

    protected build = () => new IpcIterator(
        this.entryId,
        this.iteratorIdFactory.next().value,
        this.client,
    );
}

class IpcIterator extends pre.IteratorBase<classified.Item> implements classified.Iterator {
    constructor (
        private entryId: common.EntryId,
        private iteratorId: common.IteratorId,
        private client: RequestClient,
    ) { super() }

    private perform (action: common.ActionJump): Promise<void>;
    private perform (action: common.ActionGet): pre.Result<classified.Item>;
    private perform (action: common.Action) {
        return this.client({
            op: 'perform',
            entryId: this.entryId,
            iteratorId: this.iteratorId,
            ...action,
        });
    }

    get size () { return 0 }
    jump = (term: pre.Term) => this.perform({ action: 'jump', term: term });
    get = (direction: pre.Direction) => this.perform({ action: 'get', direction: direction });
}
