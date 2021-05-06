import { app, ipcMain, session } from 'electron';
import { setupCsp } from './csp';
import { Store } from './store';
import { DisplayWindow } from './window';
import { Parser } from './parser';
import { CLI } from './input';

export default class Main {
    private static application: Electron.App;
    private static ipc: Electron.IpcMain;

    private static session: Electron.Session;
    private static store: Store;
    private static parser: Parser;
    private static displayWindow: DisplayWindow;

    static run () {
        Main.application = app;
        Main.ipc = ipcMain;

        console.log('versions:', process.versions);
        console.log(`app path: ${Main.application.getAppPath()}`);

        Main.application.once('ready', Main.onReady);
    }

    private static onReady () {
        Main.session = session.defaultSession;
        Main.store = new Store(Main.ipc);
        Main.parser = new Parser();
        Main.displayWindow = new DisplayWindow();

        setupCsp(Main.session);

        Main.load().catch(reason => {
            console.log('failed to load:', reason);
        });
    }

    private static async load () {
        const displayLoaded = Main.displayWindow.load();
        const cliSeed = Main.parser.parse(CLI.load().arguments);

        await displayLoaded;

        Main.store.addRendererTargets(Main.displayWindow.win.webContents);
        Main.store.add(cliSeed);
    }
}
