import type { BrowserWindowConstructorOptions } from 'electron';
import { BrowserWindow } from 'electron'

export class DisplayWindow {
    private static defaultOptions: BrowserWindowConstructorOptions = {
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true },
    };

    private static defaultLoadFilePath = 'index.html';

    win: BrowserWindow;

    constructor (options?: BrowserWindowConstructorOptions) {
        this.win = new BrowserWindow({
            ...DisplayWindow.defaultOptions,
            ...options,
        });
    }

    async load (filePath = DisplayWindow.defaultLoadFilePath) {
        return this.win.loadFile(filePath);
    }
}
