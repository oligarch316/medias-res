import * as loader from './load/loader';

export { LoadedData, LoadedItem } from './load/loader';

export type Options = {
    cacheSize: number;
};

export class Loader {
    private static defaultOptions: Options = { cacheSize: 0 };

    private opts: Options;
    readonly load: loader.Loader;

    constructor (opts?: Partial<Options>) {
        this.opts = { ...Loader.defaultOptions, ...opts };

        if (this.opts.cacheSize < 1) {
            this.load = loader.loadBasic;
        } else {
            const cache = new loader.Cache(this.opts.cacheSize);
            this.load = x => cache.load(x);
        }
    }
}
