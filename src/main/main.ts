import type * as collection from '../data/collection';

import { app, ipcMain, session } from 'electron';

import * as id from '../common/id';
import * as input from '../input';

import { setupCsp } from './csp';
import * as classify from './classify';
import * as optionstore from './optionstore';
import * as pane from './pane';
import * as store from './store';

const collectionInfoTODO: collection.Info = {
    name: 'TODO: collection name',
    description: 'TODO: collection description',
};

export default class Main {
    private static instance: Instance;

    static run () {
        // Enforce single instance
        if (!app.requestSingleInstanceLock()) app.quit();

        // TODO: Remove me
        console.log('versions:', process.versions);

        app.once('ready', Main.onceReady);
    }

    private static onceReady () {
        setupCsp(session.defaultSession);

        const loadResult = input.sources.load(
            process.cwd(),
            process.argv.slice(2),
        );

        console.log('input load result:');
        console.log('> options:', loadResult.opts);
        console.log('> context:', loadResult.ctx);
        console.log('> args:', loadResult.args);

        Main.instance = new Instance(loadResult.opts);
        Main.instance.load()
            .then(() => Main.initialize(loadResult.ctx, loadResult.args))
            .catch(x => console.log('load error', x));
    }

    private static initialize (ctx: input.context.Complete, args: string[]) {
        Main.instance.addCollection(collectionInfoTODO, ctx, args);
        app.on('second-instance', Main.onSecondInstance);
    }

    private static onSecondInstance (_: Event, args: string[], workingDirectory: string) {
        const loadResult = input.sources.load(workingDirectory, args);
        Main.instance.addCollection(
            collectionInfoTODO,
            loadResult.ctx,
            loadResult.args,
        );
    }
}

class Instance {
    private static idFactory = id.factory();

    private instanceId: id.Id;
    private store: store.Store;
    private optionStore: optionstore.Store;
    private display: pane.Display;
    private classifier: classify.Classifier;

    constructor (private opts: input.options.Complete) {
        this.instanceId = Instance.idFactory.next().value;
        this.store = new store.Store(ipcMain);
        this.optionStore = new optionstore.Store(ipcMain);
        this.display = new pane.Display(opts.main.pane);
        
        const httpHandler = new classify.handlers.http.Handler({ /* TODO */ });
        const fsHandler = new classify.handlers.fs.Handler({ /* TODO */ });
        
        this.classifier = new classify.Classifier(
            opts.main.classify,
            (raw, ctx) => httpHandler.handle(raw, ctx),
            (raw, ctx) => fsHandler.handle(raw, ctx),
        );
    }

    async load () {
        this.optionStore.add(this.instanceId, this.opts.render);
        await this.display.load(this.instanceId);
        this.store.addRendererTarget(this.display.webContents);
    }

    addCollection (info: collection.Info, ctx: input.context.Complete, args: string[]) {
        const seed = this.classifier.classify(args, ctx.main.classify);
        this.store.set(seed, { info: info, ctx: ctx.render });
    }
}
