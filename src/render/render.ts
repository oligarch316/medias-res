import type { IpcRenderer } from 'electron';

import { ipcRenderer } from 'electron';
import * as pre from '../common/preiterable/async';
import * as store from './store';
import * as parser from './parser';
import * as loader from './loader';
import * as pane from './pane';

export default class Render {
    private static baseElementId = 'app';

    private static baseElement: HTMLElement;
    private static ipc: IpcRenderer;
    
    private static store: store.Store;
    private static parser: parser.Parser;
    private static loader: loader.Loader;
    private static panes: Panes;

    static run() {
        const baseElement = document.getElementById(Render.baseElementId);
        if (baseElement === null) {
            throw new Error(`failed to find base element: ${Render.baseElementId}`);
        }

        Render.baseElement = baseElement;
        Render.ipc = ipcRenderer;
        
        Render.store = new store.Store(Render.ipc);
        Render.parser = new parser.Parser();
        Render.loader = new loader.Loader({ cacheSize: 1024 });

        Panes.define();
        Render.panes = new Panes(Render.store, Render.parser, Render.loader);

        Render.baseElement.appendChild(Render.panes.display);
    }
}

class Panes {
    static define () { pane.defineAll() }

    display: pane.Display;
    select: pane.Select;

    constructor (
        private store: store.Store,
        private parser: parser.Parser,
        private loader: loader.Loader,
    ) {
        this.display = new pane.Display();
        this.select = new pane.Select();

        this.store.onChange(event => this.handleStoreChange(event));
        window.addEventListener('keydown', event => this.handleKeyDown(event));
    }

    private processFromStore(id: symbol) {
        const storeRes = this.store.get(id);
        if (storeRes === undefined) return undefined;

        const seed = this.parser.parse(storeRes);
        const loadedItems = this.loader.load(pre.HeteroStack.flatten(seed));
        return loadedItems;
    }

    private handleStoreChange (event: store.ChangeEvent) {
        switch (event.op) {
            case 'set':
                if (event.ids.length < 1) return;
                
                this.select.add(...event.ids);

                if (this.display.iterableId === undefined) {
                    const processed = this.processFromStore(event.ids[0]);
                    this.display.update(processed);
                }

                break;
            case 'delete':
                this.select.delete(...event.ids);
                
                const includesDisplay = this.display.iterableId !== undefined && event.ids.includes(this.display.iterableId);
                if (includesDisplay) this.display.update(undefined);

                break;
            case 'clear':
                this.select.clear();
                this.display.update(undefined);

                break;
        }
    }

    private handleKeyDown (event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowLeft':
                this.display.move('previous');
                break;
            case 'ArrowRight':
                this.display.move('next');
                break;
        }
    }
}
