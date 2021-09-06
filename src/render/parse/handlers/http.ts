import type * as classified from '../../../data/classified';
import type * as parsed from '../../../data/parsed';
import type * as handler from '../handler';

export type Options = {};

export class Handler implements handler.Handler<'http' | 'https'> {
    constructor (private opts: Options) {};

    async handle (item: classified.HTTPItem | classified.HTTPSItem): Promise<parsed.Item | parsed.Recursable> {
        // TODO: try https://github.com/sindresorhus/got
        
        throw new Error('http|https parsing not yet implemented');
    }
}
