import * as pre from '../../common/preiterable/async';
import * as data from '../data';

export type Handler = (raw: string) => Promise<data.Item | data.Seed | undefined>;
export type Parser = (raw: AsyncIterable<string>) => data.Seed;

export class HandlerSet extends Set<Handler> {
    private static isSync (x: Iterable<string> | AsyncIterable<string>): x is Iterable<string> {
        return (x as Iterable<string>)[Symbol.iterator] !== undefined;
    }

    private async *genFromSync (iterable: Iterable<string>) {
        for (const raw of iterable) {
            const res = await this.handle(raw);
            if (res !== undefined) yield res;
        }
    }

    private async *genFromAsync (iterable: AsyncIterable<string>) {
        for await (const raw of iterable) {
            const res = await this.handle(raw);
            if (res !== undefined) yield res;
        }
    }

    async handle (raw: string) {
        for (const handler of this) {
            const res = await handler(raw);
            if (res !== undefined) return res;
        }
        return undefined;
    }

    parse (iterable: Iterable<string> | AsyncIterable<string>) {
        const gen = (HandlerSet.isSync(iterable))
            ? this.genFromSync(iterable)
            : this.genFromAsync(iterable);

        return pre.HomoStack.collate(gen);
    }
}
