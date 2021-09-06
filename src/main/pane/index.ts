import type * as options from './options';
import type { WebPreferences } from 'electron';

import * as id from '../../common/id';

import { BrowserWindow } from 'electron';

export type Options = options.Complete;

export class Display {
    private static htmlFilePath = 'display.html';

    private static webPreferences: WebPreferences = {
        nodeIntegration: true,
    };

    private win: BrowserWindow;

    constructor (private opts: Options) {
        this.win = new BrowserWindow({
            width: opts.width,
            height: opts.height,
            webPreferences: Display.webPreferences,
        });
    }

    get webContents () { return this.win.webContents }

    load (instanceId: id.Id) {
        const filePath = Display.htmlFilePath;
        const queryRecord = { id: id.toString(instanceId) };

        return this.win.loadFile(filePath, { query: queryRecord });
    }
}
