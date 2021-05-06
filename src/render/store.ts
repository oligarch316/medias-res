import type { IpcRenderer, IpcRendererEvent } from 'electron';
import type * as data from './data';

import { EventEmitter } from 'events';
import * as pre from '../common/preiterable/async';
import * as common from '../common/store';

class IpcIterable extends pre.IterableBase<data.common.Item> {
    private iteratorIdFactory: common.IdFactory;

    constructor (
        private commonId: common.Id,
        private sender: common.ItemSender,
        id: string | symbol = 'renderer.ipcIterable',
    ) {
        super(id);
        this.iteratorIdFactory = common.genIds();
    }

    private get itemIds (): common.ItemIds {
        return {
            iterableId: this.commonId,
            iteratorId: this.iteratorIdFactory.next().value,
        };
    }

    protected build () { return new IpcIterator(this.itemIds, this.sender) }
}

class IpcIterator extends pre.IteratorBase<data.common.Item> {
    constructor (
        private itemIds: common.ItemIds,
        private sender: common.ItemSender,
    ) { super() }

    private sendRequest (req: common.ItemGet): pre.Result<data.common.Item>;
    private sendRequest (req: common.ItemJump): Promise<void>;
    private sendRequest (req: common.ItemRequest) { return this.sender(req) }

    get size () { return 0 }
    jump = (term: pre.Term) => this.sendRequest({ action: 'jump', term: term, ...this.itemIds });
    get = (direction: pre.Direction) => this.sendRequest({ action: 'get', direction: direction, ...this.itemIds });
}

export type ChangeEvent = { op: 'set', ids: symbol[] } |
                          { op: 'delete', ids: symbol[] } |
                          { op: 'clear' };

export type ChangeListener = (event: ChangeEvent) => void;

export class Store {
    private static opEventName = 'operation-event';

    private iterableIdMap: Map<symbol, common.Id>;
    private iterableMap: Map<common.Id, pre.Iterable<data.common.Item>>;
    private opEmitter: EventEmitter;
    private itemSender: common.ItemSender;

    constructor (ipc: IpcRenderer, channelPrefix?: string) {
        const channels = new common.Channels(channelPrefix);

        this.iterableIdMap = new Map();
        this.iterableMap = new Map();
        this.opEmitter = new EventEmitter();
        this.itemSender = channels.item.sender(ipc);

        channels.operation.receiver(ipc)(this.handleOperationMessage.bind(this));
    }

    private handleOpSet (ids: common.Id[]): ChangeEvent {
        const symbolIds: symbol[] = [];
        for (const id of ids) {
            const existingSymbol = this.iterableMap.get(id)?.id;
            const iterable = new IpcIterable(id, this.itemSender, existingSymbol);
            
            if (existingSymbol === undefined) this.iterableIdMap.set(iterable.id, id);
            this.iterableMap.set(id, iterable);

            symbolIds.push(iterable.id);
        }
        return { op: 'set', ids: symbolIds };
    }

    private handleOpDelete (ids: common.Id[]): ChangeEvent | undefined {
        const deletedIds: symbol[] = [];
        for (const id of ids) {
            const iterable = this.iterableMap.get(id);
            if (iterable === undefined) continue;

            this.iterableIdMap.delete(iterable.id);
            this.iterableMap.delete(id);
            deletedIds.push(iterable.id);
        }
        return (deletedIds.length > 0) ? { op: 'delete', ids: deletedIds } : undefined;
    }

    private handleOpClear (): ChangeEvent {
        this.iterableIdMap.clear();
        this.iterableMap.clear();
        return { op: 'clear' };
    }

    private handleOperationMessage (_: IpcRendererEvent, message: common.OperationMessage) {
        let event: ChangeEvent | undefined;
        switch (message.op) {
            case 'set':
                event = this.handleOpSet(message.iterableIds);
                break;
            case 'delete':
                event = this.handleOpDelete(message.iterableIds);
                break;
            case 'clear':
                event = this.handleOpClear();
                break;
        }
        if (event !== undefined) this.opEmitter.emit(Store.opEventName, event);
    }


    onChange (listener: ChangeListener) {
        this.opEmitter.on(Store.opEventName, listener);
    }

    removeChangeListener (listener: ChangeListener) {
        this.opEmitter.removeListener(Store.opEventName, listener);
    }

    removeAllChangeListeners () {
        this.opEmitter.removeAllListeners(Store.opEventName);
    }

    get (id: symbol) {
        const commonId = this.iterableIdMap.get(id);
        return (commonId === undefined) ? undefined : this.iterableMap.get(commonId);
    }
}
