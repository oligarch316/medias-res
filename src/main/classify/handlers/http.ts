import type * as classified from '../../../data/classified';
import type * as handler from '../handler';

import { isWebUri } from 'valid-url';

export type Options = {};

export class Handler implements handler.Handler {
    constructor (private opts: Options) {}

    private static protocolFor = (s: string) => (s.startsWith('https'))
        ? 'https'
        : 'http';

    private static urlStringFor = encodeURI;

    async handle (raw: string, _: handler.Context): Promise<classified.HTTPItem | classified.HTTPSItem | undefined> {
        const webURL = isWebUri(raw);
        return (webURL === undefined)
            ? undefined
            : {
                protocol: Handler.protocolFor(webURL),
                urlString: Handler.urlStringFor(webURL),
            };
    }
}
