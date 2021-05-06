import * as data from '../data';
import { isWebUri } from 'valid-url';

export class Handler {
    async handle (raw: string): Promise<data.common.HTTPItem | undefined> {
        const webUrl = isWebUri(raw);
        return (webUrl === undefined)
            ? undefined
            : {
                protocol: (webUrl.startsWith('https')) ? 'https' : 'http',
                urlString: encodeURI(webUrl),
            };
    }
}
