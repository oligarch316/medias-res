import type { IpcRenderer, IpcRendererEvent } from 'electron';
import type * as classified from '../../data/classified';

import * as id from '../../common/id';
import * as pre from '../../common/preiterable/async';
import * as collectionIpc from '../../common/ipc/collection';
import * as iterableIpc from '../../common/ipc/iterable';
import { EventEmitter } from 'events';

type CollectionRequestSender = ReturnType<collectionIpc.Channels['request']['sender']>;
type IterableRequestSender = ReturnType<iterableIpc.Channels['request']['sender']>;

export type ChangeEvent = collectionIpc.Message;
export type ChangeListener = (event: ChangeEvent) => void;

export type Data = collectionIpc.ResponseGet & { iterable: classified.Iterable };

export class Store {
    private static readonly changeEventName = 'change-event';

    private collections: Set<id.Collection>;
    private messageEmitter: EventEmitter;

    private sendCollectionRequest: CollectionRequestSender;
    private sendIterableRequest: IterableRequestSender;

    constructor (ipc: IpcRenderer, instanceId: id.Instance) {
        const instanceIdStr = id.toString(instanceId);

        const collectionChannels = new collectionIpc.Channels(`${instanceIdStr}-collection`);
        const iterableChannels = new iterableIpc.Channels(`${instanceIdStr}-iterable`);

        this.collections = new Set();
        this.messageEmitter = new EventEmitter();

        this.sendCollectionRequest = collectionChannels.request.sender(ipc);
        this.sendIterableRequest = iterableChannels.request.sender(ipc);

        collectionChannels.message.receiver(ipc)(this.handleCollectionMessage.bind(this));
    }

    private doCollectionRequest (req: collectionIpc.RequestList): Promise<collectionIpc.ResponseList>;
    private doCollectionRequest (req: collectionIpc.RequestGet): Promise<collectionIpc.ResponseGet>;
    private doCollectionRequest (req: collectionIpc.Request) { return this.sendCollectionRequest(req) }

    private handleCollectionMessage (_: IpcRendererEvent, message: collectionIpc.Message) {
        this.handleChangeEvent(message);
    }

    private handleChangeEvent (message: collectionIpc.Message) {
        switch (message.op) {
            case 'set':
                this.collections.add(message.collectionId);
                break;
            case 'delete':
                this.collections.delete(message.collectionId);
                break;
            case 'clear':
                this.collections.clear();
                break;
        }

        this.messageEmitter.emit(Store.changeEventName, message);
    }

    // ----- Change event listener operations
    addChangeListener (listener: ChangeListener) {
        this.messageEmitter.addListener(Store.changeEventName, listener);
    }

    deleteChangeListener (listener: ChangeListener) {
        this.messageEmitter.removeListener(Store.changeEventName, listener);
    }
    
    clearChangeListeners () {
        this.messageEmitter.removeAllListeners(Store.changeEventName);
    }

    // ----- Collection operations
    async load () {
        const resp = await this.doCollectionRequest({ op: 'list' });
        for (const collectionId of resp) this.handleChangeEvent({ op: 'set', collectionId: collectionId });
    }

    async get (collectionId: id.Collection): Promise<Data> {
        const resp = await this.doCollectionRequest({ op: 'get', id: collectionId });
        const iterable = new IpcIterable(collectionId, this.sendIterableRequest);
        
        return { iterable: iterable, ...resp };
    }

    list (): id.Collection[] { return Array.from(this.collections) }
}

class IpcIterable extends pre.IterableBase<classified.Item> {
    private iteratorIdFactory: id.Factory;

    constructor (
        private collectionId: id.Collection,
        private client: IterableRequestSender,
        iterableId: string | symbol = 'renderer.ipcIterable',
    ) {
        super(iterableId);
        this.iteratorIdFactory = id.factory();
    }

    protected build = () => new IpcIterator(this.client, {
        collectionId: this.collectionId,
        iteratorId: this.iteratorIdFactory.next().value,
    });
}

class IpcIterator extends pre.IteratorBase<classified.Item> {
    constructor (
        private client: IterableRequestSender,
        private ids: { collectionId: id.Collection, iteratorId: id.Iterator },
    ) { super() }

    private doRequest (req: iterableIpc.RequestGet): Promise<iterableIpc.ResponseGet>;
    private doRequest (req: iterableIpc.RequestJump): Promise<iterableIpc.ResponseJump>;
    private doRequest (req: iterableIpc.Request) { return this.client(req) }

    get size () { return 0 }
    jump = (term: pre.Term)           => this.doRequest({ op: 'jump', term: term,           ...this.ids });
    get  = (direction: pre.Direction) => this.doRequest({ op: 'get',  direction: direction, ...this.ids });
}
