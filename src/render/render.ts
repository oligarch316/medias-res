import { ipcRenderer } from 'electron';

import * as id from '../common/id';

import * as load from './load';
import * as log from './log';
import * as pane from './pane';
import * as parse from './parse';
import * as store from './store';

type CollectionData = store.collection.Data & { id: id.Collection };

export default class Render {
    private static readonly baseElementId = 'app';

    private static baseElement: HTMLElement;
    private static instanceId: id.Instance;
    private static optionsStore: store.options.Store;
    
    private static logger: log.Logger;
    private static parser: parse.Parser;
    private static loader: load.Loader;
    private static collectionStore: store.collection.Store;
    private static display: pane.Display;

    private static currentCollection: CollectionData | undefined;

    static run () {
        pane.define();

        Render.baseElement = Render.findBaseElement();
        Render.instanceId = id.instanceFromLocation(window.location);
        Render.optionsStore = new store.options.Store(ipcRenderer);

        Render.initialize()
            .then(() => {
                Render.collectionStore.addChangeListener(event => Render.handleCollectionStoreChange(event));
                window.addEventListener('keydown', event => Render.handleKeyDown(event));

                Render.collectionStore.load();
            })
            .catch(reason => { throw new Error(reason) /* TODO */ });
    }

    private static findBaseElement () {
        const res = document.getElementById(Render.baseElementId);
        if (res === null) throw new Error(`failed to find base element with id: ${Render.baseElementId}`);
        return res;
    }

    private static async initialize () {
        const opts = await Render.optionsStore.get(Render.instanceId);

        Render.logger = new log.Logger({ todo: 'TODO' }, ipcRenderer);

        const httpHandler = new parse.handlers.http.Handler({ /* TODO */ });
        const fsHandler = new parse.handlers.fs.Handler({ /* TODO */ });

        Render.parser = new parse.Parser(opts.parse, {
            http: item => httpHandler.handle(item),
            https: item => httpHandler.handle(item),
            fs: item => fsHandler.handle(item),
        });

        Render.loader = new load.Loader(opts.load);
        Render.collectionStore = new store.collection.Store(ipcRenderer, Render.instanceId);
        Render.display = new pane.Display('display', opts.pane);

        Render.baseElement.appendChild(Render.display);
    }

    private static async setCurrentCollection (collectionId: id.Collection | undefined) {
        if (collectionId === undefined) {
            Render.display.iterable = undefined;
            Render.currentCollection = undefined;
            return;
        }

        const data = await Render.collectionStore.get(collectionId);
        const parsedIterable = Render.parser.parse(data.iterable, data.ctx.parse);
        const loadedIterable = Render.loader.load(parsedIterable, data.ctx.load);
        
        Render.display.iterable = loadedIterable;
        Render.currentCollection = { id: collectionId, ...data };
    }

    private static handleCollectionStoreChange (event: store.collection.ChangeEvent) {
        switch (event.op) {
            case 'set':
                if (Render.currentCollection !== undefined) return;
                
                Render.setCurrentCollection(event.collectionId);
                break;
            case 'delete':
                if (Render.currentCollection === undefined) return;
                if (Render.currentCollection.id !== event.collectionId) return;

                const remainingIds = Render.collectionStore.list();
                if (remainingIds.length < 1) return;
                
                Render.setCurrentCollection(remainingIds[0]);
                break;
            case 'clear':
                Render.setCurrentCollection(undefined);
                break;
        }
    }

    private static handleKeyDown (event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowLeft':
                Render.display.move('previous');
                break;
            case 'ArrowRight':
                Render.display.move('next');
                break;
        }
    }
}
