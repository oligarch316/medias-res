import type * as classified from '../../data/classified';
import type * as handler from './handler';
import type * as options from './options';
import type * as context from './context';

import * as pre from '../../common/preiterable/async';
import * as parsed from '../../data/parsed';
import * as filters from '../../filters/parsed';

export type Options = options.Complete;
export type Context = context.Complete;

export class Parser implements handler.Handler<classified.Protocol> {
    private stackLoader: pre.HeteroStackLoader<parsed.Item>;

    constructor (
        private opts: Options,
        private handlers: { [ P in classified.Protocol ]: handler.Function<P> },
    ) {
        this.stackLoader = (opts.cacheSize > 0 )
            ? pre.HeteroStack.cachedLoader(opts.cacheSize)
            : pre.HeteroStack.basicLoader;
    }

    private handlerFor<P extends classified.Protocol> (protocol: P): handler.Function<P>;
    private handlerFor (protocol: classified.Protocol) {
        return this.handlers[protocol];
    }

    private collate (input: classified.Iterable): parsed.Recursable {
        return new pre.TransformedIterable(input, item => this.handle(item));
    }

    private flatten (recursable: parsed.Recursable, ctx: Context): parsed.Iterable {
        return (ctx.recurse)
            ? pre.HeteroStack.flatten(recursable, this.stackLoader)
            : pre.FilteredIterable.from(
                recursable,
                (x): x is parsed.Item => !parsed.isRecursable(x)
            );
    }

    handle (item: classified.Item) {
        return this.handlerFor(item.protocol)(item);
    }

    parse (input: classified.Iterable, ctx: Context): parsed.Iterable {
        const filterFunc = filters.merge(...ctx.filters);
        
        const recursable = this.collate(input);
        const iterable = this.flatten(recursable, ctx);
        return pre.FilteredIterable.from(iterable, filterFunc);
    }
}
