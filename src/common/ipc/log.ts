import * as channel from './channel';
import * as log from '../log';

export type Message = {
    level: log.Level;
    message: any;
};

export class Channels {
    private static _message = channel.fire<Message>('renderer');

    readonly message: channel.Named<typeof Channels._message>;

    constructor (prefix = 'log') {
        this.message = channel.named(`${prefix}-message`, Channels._message);
    }
}
