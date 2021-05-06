import type { IpcMain, WebContents, IpcMainInvokeEvent } from 'electron';

import * as pre from '../common/preiterable/async';
import * as common from '../common/store';
import * as data from './data';

type WebContentsId = number;
type IteratorMap = Map<common.Id, pre.Iterator<data.Item>>;
type SeedData = {
    iterable: pre.Iterable<data.Item>;
    iterators: Map<WebContentsId, IteratorMap>;
};

export class Store {
    private seedIdMap: Map<symbol, common.Id>;
    private dataMap: Map<common.Id, SeedData>;
    private stackLoader: pre.HomoStackLoader<data.Item>;
    private rendererTargets: Set<WebContents>;

    private idFactory: common.IdFactory;
    private opSenderFactory: (target: WebContents) => common.OperationSender;

    constructor (ipc: IpcMain, channelPrefix?: string) {
        const channels = new common.Channels(channelPrefix);
        
        this.seedIdMap = new Map();
        this.dataMap = new Map();
        this.stackLoader = pre.HomoStack.basicLoader; // TODO: Change this to cachedLoader
        this.rendererTargets = new Set();
        
        this.idFactory = common.genIds();
        this.opSenderFactory = channels.operation.sender;

        channels.item.receiver(ipc)(this.handleItemRequest.bind(this));
    }

    private loadIterator (webContentsId: WebContentsId, req: common.ItemRequest) {
        const data = this.dataMap.get(req.iterableId);
        if (data === undefined) {
            throw new Error(`invalid request.iterableId: ${req.iterableId}`);
        }

        let iteratorMap = data.iterators.get(webContentsId);
        if (iteratorMap === undefined) {
            iteratorMap = new Map();
            data.iterators.set(webContentsId, iteratorMap);
        }

        let iterator = iteratorMap.get(req.iteratorId);
        if (iterator === undefined) {
            iterator = data.iterable[pre.Symbol]();
            if (req.action === 'get') iterator.jump(pre.startOf(req.direction));
            iteratorMap.set(req.iteratorId, iterator);
        }

        return iterator;
    }

    private handleItemRequest (event: IpcMainInvokeEvent, req: common.ItemRequest) {
        const iterator = this.loadIterator(event.sender.id, req);
        return (req.action === 'get')
            ? iterator.get(req.direction)
            : iterator.jump(req.term);
    }

    private sendOperation (message: common.OperationMessage) {
        for (const target of this.rendererTargets) this.opSenderFactory(target)(message);
    }

    addRendererTargets (...targets: WebContents[]) {
        const newTargets = targets.filter(target => !this.rendererTargets.has(target));
        if (newTargets.length < 1) return;

        const backfillMessage: common.OperationMessage = {
            op: 'set',
            iterableIds: Array.from(this.dataMap.keys()),
        };

        const add = (backfillMessage.iterableIds.length < 1)
            ? target => { this.rendererTargets.add(target) }
            : target => {
                this.rendererTargets.add(target);
                this.opSenderFactory(target)(backfillMessage);
            };

        for (const target of newTargets) add(target);
    }

    deleteRendererTargets (...targets: WebContents[]) {
        for (const target of targets) this.rendererTargets.delete(target);
    }

    clearRendererTargets () { this.rendererTargets.clear() }

    add (...seeds: data.Seed[]) {
        const commonIds: common.Id[] = [];
        for (const seed of seeds) {
            let commonId = this.seedIdMap.get(seed.id);
            if (commonId === undefined) {
                commonId = this.idFactory.next().value;
                this.seedIdMap.set(seed.id, commonId);
            }

            // TODO: Pretty sure we don't want/need to copy the original
            // seed id here but think about it again later
            this.dataMap.set(commonId, {
                iterable: pre.HomoStack.flatten(seed, this.stackLoader),
                iterators: new Map(),
            });

            commonIds.push(commonId);
        }

        this.sendOperation({ op: 'set', iterableIds: commonIds });
    }

    delete (...seeds: data.Seed[]) {
        const deletedIds: common.Id[] = [];
        for (const seed of seeds) {
            const commonId = this.seedIdMap.get(seed.id);
            if (commonId === undefined) continue;

            this.seedIdMap.delete(seed.id);
            this.dataMap.delete(commonId);
            deletedIds.push(commonId);
        }

        if (deletedIds.length > 0) this.sendOperation({ op: 'delete', iterableIds: deletedIds });
    }

    clear () {
        this.seedIdMap.clear();
        this.dataMap.clear();
        this.sendOperation({ op: 'clear' });
    }
}
