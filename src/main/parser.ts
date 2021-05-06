import * as data from './data';
import * as base from './parse/parser';
import { Handler as FSHandler } from './parse/fs';
import { Handler as HTTPHandler } from './parse/http';

export class Parser {
    private handlers: base.HandlerSet;

    constructor () {
        const me: base.Parser = raw => this.parse(raw);

        this.handlers = new base.HandlerSet([
            raw => new HTTPHandler().handle(raw),
            raw => new FSHandler(me).handle(raw),
        ]);
    }

    parse (raw: Iterable<string> | AsyncIterable<string>): data.Seed {
        return this.handlers.parse(raw)
    }
}
