import type * as classified from '../../data/classified';
import type * as handler from  './handler';
import type * as options from './options';
import type * as context from './context';

import * as pre from '../../common/preiterable/async';
import * as filter from './filter';

export type Options = options.Complete;
export type Context = context.Complete;

export class Classifier implements handler.Handler {
    private static isSyncInput (x: Iterable<string> | AsyncIterable<string>): x is Iterable<string> {
        return (x as Iterable<string>)[Symbol.iterator] !== undefined;
    }

    private handlerSet: Set<handler.Function>;
    private stackLoader: pre.HeteroStackLoader<classified.Item>;

    constructor (private opts: Options, ...handlers: handler.Function[]) {
        this.handlerSet = new Set(handlers);
        this.stackLoader = (opts.cacheSize > 0)
            ? pre.HeteroStack.cachedLoader(opts.cacheSize)
            : pre.HeteroStack.basicLoader;
    }

    private buildHandlerContext (ctx: Context) {
        const handlerCtx: handler.Context = {
            workingDirectory: ctx.workingDirectory,
            recurse: input => this.collate(input, handlerCtx),
        };
        return handlerCtx;
    };

    private async *genFromSync (iterable: Iterable<string>, ctx: handler.Context) {
        for (const raw of iterable) {
            const res = await this.handle(raw, ctx);
            if (res !== undefined) yield res;
            
            // TODO: else => Report string of unknown "class"
        }
    }

    private async *genFromAsync (iterable: AsyncIterable<string>, ctx: handler.Context) {
        for await (const raw of iterable) {
            const res = await this.handle(raw, ctx);
            if (res !== undefined) yield res;
            
            // TODO: else => Report string of unknown "class"
        }
    }

    private collate (input: Iterable<string> | AsyncIterable<string>, ctx: handler.Context): classified.Recursable {
        const gen = (Classifier.isSyncInput(input))
            ? this.genFromSync(input, ctx)
            : this.genFromAsync(input, ctx);

        return pre.HeteroStack.collate(gen);
    }

    addHandlers (...handlers: handler.Function[]) {
        for (const handler of handlers) this.handlerSet.add(handler);
    }

    async handle (raw: string, ctx: handler.Context) {
        for (const handler of this.handlerSet) {
            const res = await handler(raw, ctx);
            if (res !== undefined) return res;
        }
        return undefined;
    }

    classify (input: Iterable<string> | AsyncIterable<string>, ctx: Context): classified.Iterable {
        const handlerCtx = this.buildHandlerContext(ctx);
        const filterFunc = filter.merge(...ctx.filters);
        
        const recursable = this.collate(input, handlerCtx);
        const iterable = pre.HeteroStack.flatten(recursable, this.stackLoader);
        return pre.FilteredIterable.from(iterable, filterFunc);
    }
}
