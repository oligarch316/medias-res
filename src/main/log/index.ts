import type { IpcMain } from 'electron';

import * as logIpc from '../../common/ipc/log';
import * as common from '../../common/log';
import * as options from './options';

import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as logform from 'logform';

export type Level = common.Level;

function encodeWinstonFormat (format: options.Format): logform.Format {
    switch (format) {
        case 'json':
            return winston.format.json({ space: 2 });
    }
}

function encodeWinstonTransport (output: options.Output): Transport {
    switch (output) {
        case 'stdout':
            return new winston.transports.Console();
        case 'stderr':
            return new winston.transports.Console({ stderrLevels: Array.from(common.levels) });
    }
}

export class Logger implements common.Logger {
    static readonly severities: { [K in Level]: number } = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    };

    static readonly colors: { [K in Level]: string } = {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'gray',
    };

    private static initialize = () => {
        winston.addColors(Logger.colors);
        Logger.initialize = () => {};
    };

    private winstonLogger: winston.Logger;

    constructor (private opts: options.Complete, ipc: IpcMain, channelPrefix?: string) {
        Logger.initialize();

        const channels = new logIpc.Channels(channelPrefix);

        this.winstonLogger = winston.createLogger({
            level: opts.level,
            levels: Logger.severities,
            format: winston.format.combine(
                winston.format.colorize(),
                encodeWinstonFormat(opts.format),
            ),
            transports: [
                encodeWinstonTransport(opts.output),
            ],
        });

        channels.message.receiver(ipc)(
            (_, message) => this.log(message.level, message.message)
        );
    }

    log (level: Level, message: any) { this.winstonLogger.log(level, message) }

    error = (message: any) => this.log('error', message);
    warn  = (message: any) => this.log('warn', message);
    info  = (message: any) => this.log('info', message);
    debug = (message: any) => this.log('debug', message);
}
