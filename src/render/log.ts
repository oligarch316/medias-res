import type { IpcRenderer } from 'electron';

import * as logIpc from '../common/ipc/log';
import * as common from '../common/log';

export type Level = common.Level;

export class Logger implements common.Logger {
    private sendMessage: ReturnType<logIpc.Channels['message']['sender']>;

    constructor (private opts: { todo: 'TODO' }, ipc: IpcRenderer, channelPrefix?: string) {
        const channels = new logIpc.Channels(channelPrefix);
        this.sendMessage = channels.message.sender(ipc);
    }

    log (level: Level, message: any) {
        console.log(level, message);
        this.sendMessage({ level: level, message: message });
    }

    error = (message: any) => this.log('error', message);
    warn  = (message: any) => this.log('warn', message);
    info  = (message: any) => this.log('info', message);
    debug = (message: any) => this.log('debug', message);
}
