import type * as collection from '../data/collection';

import { app, ipcMain, session } from 'electron';

import * as id from '../common/id';
import * as input from '../input';

import { setupCsp } from './csp';
import * as classify from './classify';
import * as log from './log';
import * as pane from './pane';
import * as store from './store';

const collectionInfoTODO: collection.Info = {
    name: 'TODO: collection name',
    description: 'TODO: collection description',
};

type CollectionData = {
    info: collection.Info;
    ctx: input.context.Complete;
    args: string[];
};

export default class Main {
    private static readonly instanceIdFactory = id.factory();
    private static readonly collectionIdFactory = id.factory();

    private static optionsStore: store.options.Store;
    private static instances: Map<id.Instance, Instance>;
    private static mostRecentInstanceId: id.Instance;
    
    private static logger: log.Logger;
    
    static run () {
        // Enforce "single instance"
        if (!app.requestSingleInstanceLock()) app.quit();

        app.once('ready', Main.onceReady);
    }

    private static onceReady () {
        // Set up everything that doesn't require loaded input
        Main.optionsStore = new store.options.Store(ipcMain);
        Main.instances = new Map();
        setupCsp(session.defaultSession);

        // Initialize everything else that does need loaded input
        Main.initializeFirstInstance();

        // Register handler for "second instance"
        app.on('second-instance', Main.onSecondInstance);
    }

    private static initializeFirstInstance () {
        // Load initial input
        const initialLoadResult = input.sources.load(
            process.cwd(),
            process.argv.slice(2), // TODO: Un-magic-number this
        );

        // Force the "newInstance" option to be true during initialization
        initialLoadResult.opts.main.newInstance = true;

        // Create logger and log "start-up" message(s)
        Main.logger = new log.Logger(initialLoadResult.opts.main.log, ipcMain);
        
        Main.logger.info({ message: 'versions', ...process.versions });
        Main.logger.info({ message: 'loaded initial input', ...initialLoadResult });

        // Pass along to normal processing
        Main.handleLoadResult(initialLoadResult);
    }

    private static onSecondInstance (_: Event, args: string[], workingDirectory: string) {
        const loadResult = input.sources.load(workingDirectory, args);

        Main.logger.info({ message: 'loaded input', ...loadResult });

        Main.handleLoadResult(loadResult);
    }

    private static addInstance (opts: input.options.Complete): id.Instance {
        const instanceId = Main.instanceIdFactory.next().value;
        const instance = new Instance(instanceId, opts);

        Main.optionsStore.add(instanceId, opts);
        Main.instances.set(instanceId, instance);
        Main.mostRecentInstanceId = instanceId;

        // No need to await instance.load(), it's the renderer's responsibility to ...
        //  • set up ipc message handlers
        //  • send ipc requests for initial data
        // ... in a reliable manner
        instance.load();

        Main.logger.info({
            message: 'created new instance',
            instanceId: instanceId,
        });
        
        return instanceId;
    }

    private static addCollection (instanceId: id.Instance, data: CollectionData): id.Collection {
        const instance = Main.instances.get(instanceId);
        if (instance === undefined) throw new Error(`invalid instance id: ${instanceId}`);

        const collectionId = Main.collectionIdFactory.next().value;
        instance.addCollection(collectionId, data);

        Main.logger.info({
            message: 'added new collection to instance',
            instanceId: instanceId,
            collectionId: collectionId,
        });

        return collectionId;
    }

    private static handleLoadResult (loadResult: input.sources.LoadResult) {
        const instanceId = (loadResult.opts.main.newInstance)
            ? Main.addInstance(loadResult.opts)
            : Main.mostRecentInstanceId;

        const collectionData = {
            info: collectionInfoTODO,
            ctx: loadResult.ctx,
            args: loadResult.args,
        };

        Main.addCollection(instanceId, collectionData);
    }
}

class Instance {
    private classifier: classify.Classifier;
    private collectionStore: store.collection.Store;
    private display: pane.Display;
    
    constructor (readonly instanceId: id.Instance, private opts: input.options.Complete) {
        const httpHandler = new classify.handlers.http.Handler({ /* TODO */ });
        const fsHandler = new classify.handlers.fs.Handler({ /* TODO */ });

        this.classifier = new classify.Classifier(
            opts.main.classify,
            (raw, ctx) => httpHandler.handle(raw, ctx),
            (raw, ctx) => fsHandler.handle(raw, ctx),
        );
        this.collectionStore = new store.collection.Store(ipcMain, instanceId);
        this.display = new pane.Display(opts.main.pane);
    }

    async load () {
        await this.display.load(this.instanceId);
        this.collectionStore.addRendererTarget(this.display.webContents);
    }

    addCollection (collectionId: id.Collection, data: CollectionData) {
        const iterable = this.classifier.classify(data.args, data.ctx.main.classify);
        
        this.collectionStore.set(collectionId, {
            info: data.info,
            ctx: data.ctx.render,
            iterable: iterable,
        });
    }
}
