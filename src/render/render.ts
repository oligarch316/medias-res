import { ipcRenderer } from 'electron';

import * as id from '../common/id';

import * as optionstore from './optionstore';
import * as store from './store';
import * as parse from './parse';
import * as load from './load';
import * as pane from './pane';

export default class Render {
    private static baseElementId = 'app';
    private static instanceIdParamName = 'id';

    private static baseElement: HTMLElement;
    private static instanceId: id.Id;

    private static optionStore: optionstore.Store;
    private static store: store.Store;
    private static display: pane.Display;
    private static loader: load.Loader;
    private static parser: parse.Parser;

    static run () {
        pane.define();

        Render.baseElement = Render.findBaseElement();
        Render.instanceId = Render.parseInstanceId();

        Render.initialize()
            .then(Render.addListeners)
            .catch(x => console.log('initialize error', x));
    }

    private static findBaseElement () {
        const res = document.getElementById(Render.baseElementId);
        if (res === null) throw new Error(`failed to find base element for id: ${Render.baseElementId}`);
        return res;
    }

    private static parseInstanceId () {
        const params = new URLSearchParams(window.location.search.substring(1));
        const idStr = params.get(Render.instanceIdParamName);
        if (idStr === null) throw new Error(`failed to read search parameter: ${Render.instanceIdParamName}`);
        return id.fromString(idStr);        
    }

    private static async initialize () {
        Render.optionStore = new optionstore.Store(ipcRenderer);
        const opts = await Render.optionStore.get(Render.instanceId);

        Render.store = new store.Store(ipcRenderer);
        Render.display = new pane.Display('display', opts.pane);
        Render.loader = new load.Loader(opts.load);
        
        const httpHandler = new parse.handlers.http.Handler({ /* TODO */ });
        const fsHandler = new parse.handlers.fs.Handler({ /* TODO */ });
        
        Render.parser = new parse.Parser(opts.parse, {
            http: item => httpHandler.handle(item),
            https: item => httpHandler.handle(item),
            fs: item => fsHandler.handle(item),
        });

        Render.baseElement.appendChild(Render.display);

        const seedIds = await Render.store.list();
        if (seedIds.length > 0) {
            await Render.displayCollection(seedIds[0]);
        }
    }

    private static addListeners () {
        Render.store.addChangeListener(event => Render.handleStoreChange(event));
        window.addEventListener('keydown', event => Render.handleKeyDown(event));
    }

    private static async displayCollection (seedId: symbol) {
        const seedData = await Render.store.get(seedId);
        const parsedData = Render.parser.parse(seedData.iterable, seedData.meta.ctx.parse);
        const loadedData = Render.loader.load(parsedData, seedData.meta.ctx.load);

        Render.display.iterable = loadedData;
    }

    private static handleStoreChange (event: store.ChangeEvent) {
        switch (event.op) {
            case 'set':
                Render.displayCollection(event.id);
                break;
            case 'delete':
                // TODO
            case 'clear':
                // TODO
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
