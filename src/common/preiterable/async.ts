import * as sizeable from '../sizeable';
import * as PreSymbol from './private/symbol';
import * as common from './private/common';
import * as base from './private/async';
import { Iterator as SyncIterator, Result as SyncResult } from './private/sync';

// ----- Re-export
export * from './private/async';
export { Result as SyncResult} from './private/sync';

// ----- Abstract bases
export abstract class IterableBase<T> extends common.Iterable<base.Result<T>, Promise<void>> implements base.Iterable<T> {
    constructor (id: string | symbol = 'pre.asyncIterable') { super(id) }

    [Symbol.asyncIterator] = () => this[PreSymbol.asyncIterator]();
    [PreSymbol.asyncIterator] = () => this.build();
}

export abstract class IteratorBase<T> extends common.Iterator<base.Result<T>, Promise<void>> implements base.Iterator<T> {};

// ----- Utility functions
export function wrap<T> (iter: SyncIterator<T>) { return new WrappedIterator(iter) }

export function isIterable<T> (x: AsyncIterable<T>): x is base.Iterable<T>;
export function isIterable (x: any): x is base.Iterable<any>;
export function isIterable (x: any): x is base.Iterable<any> {
    return (x as base.Iterable<any>)[PreSymbol.asyncIterator] !== undefined;
}

export const isHeteroRecursable = <T>(x: T | base.HeteroRecursable<T>): x is base.HeteroRecursable<T> => isIterable(x);
export const isHomoRecursable = <T>(x: T | base.HomoRecursable<T>): x is base.HomoRecursable<T> => isIterable(x);

class WrappedIterator<T> extends IteratorBase<T> {
    constructor (private syncIter: SyncIterator<T>) { super() }

    get size () { return this.syncIter.size }
    async jump (term: base.Term) { return this.syncIter.jump(term) }
    async get (direction: base.Direction) { return this.syncIter.get(direction) }
}

// ----- Basic array
class ArrayIterator<T> extends IteratorBase<T> {
    private baseArray: common.ArrayIterator<Promise<T>>;

    constructor (data: Promise<T>[]) {
        super();
        this.baseArray = new common.ArrayIterator(data);
    }

    get size () { return this.baseArray.size }
    async jump (term: base.Term) { return this.baseArray.jump(term) }
    async get (direction: base.Direction): base.Result<T> {
        const res = this.baseArray.get(direction);
        return (res.done) ? res : { done: false, value: await res.value };
    }
}

class _Array<T> extends IterableBase<T> {
    constructor (private data: Promise<T>[], id: string | symbol = 'pre.asyncArray') { super(id) }
    protected build () { return new ArrayIterator(this.data) }
}

export { _Array as Array };

// ----- Lazy array
type LazyLoader<T> = common.LazyLoader<base.Result<T>, Promise<void>>;

class LazyArrayIterator<T> extends IteratorBase<T> {
    private baseArray: common.ArrayIterator<T>;

    constructor (data: T[], private loader: LazyLoader<T>) {
        super();
        this.baseArray = new common.ArrayIterator(data);
    }

    private markComplete () {
        this.jump = term => Promise.resolve(this.baseArray.jump(term));
        this.get = direction => Promise.resolve(this.baseArray.get(direction));
    }

    private async loadNext () {
        const res = await this.loader.next();
        if (res.done) this.markComplete();
        return res;
    }

    private async loadAll () {
        await this.loader.all();
        this.markComplete();
    }

    get size () { return this.baseArray.size }

    async jump (term: base.Term) {
        if (term === 'EOD') await this.loadAll();
        return this.baseArray.jump(term);
    }

    async get (direction: base.Direction) {
        const res = this.baseArray.get(direction);
        return (res.done && direction == 'next') ? this.loadNext() : res;
    }
}

export class LazyArray<T> extends IterableBase<T> {
    private data: T[];
    private iter: AsyncIterator<T> | undefined;

    constructor (iterable: AsyncIterable<T>, id?: string | symbol) {
        super(id);
        this.data = [];
        this.iter = iterable[Symbol.asyncIterator]();
    }

    private async loadNext (): base.Result<T> {
        if (this.iter === undefined) return { done: true, value: 'EOD' };

        const res = await this.iter.next();
        if (res.done) {
            this.iter = undefined;
            return { done: true, value: 'EOD' };
        }

        this.data.push(res.value);
        return res;
    }

    private async loadAll () {
        for (let x = await this.loadNext(); !x.done; x = await this.loadNext());
    }

    private loader = {
        next: () => this.loadNext(),
        all: () => this.loadAll(),
    };

    protected build () {
        return (this.complete)
            ? wrap(new common.ArrayIterator(this.data))
            : new LazyArrayIterator(this.data, this.loader);
    }

    get complete () { return this.iter === undefined };
    preload () { return this.loadAll() }
}

// TODO: Adding Filter|Transform Iter[ator|able]s here begs the question
// about caching/windowing/something. Do we expect the used to wrap any
// new Filtered/Transformed Iter* in a LazyArray when necessary?
// Do we provide an option for retaining some-but-not-all filter/transform
// logic without re-applying when moving back and forth? => domain of caching/windowing.

export class FilteredIterator<T, U extends T> extends IteratorBase<U> {
    constructor (
        private iterator: base.Iterator<T>,
        private filter: (item: T) => item is U,
    ) { super() }

    // TODO: Again these lazy size calculations are misleading.
    // Is size supposed to proxy for space in memory? logical length? ...
    get size () { return this.iterator.size }

    jump (term: base.Term) { return this.iterator.jump(term) }

    async get (direction: base.Direction) {
        while (true) {
            const res = await this.iterator.get(direction);
            if (res.done || this.filter(res.value)) return res as SyncResult<U>;
        }
    }
}

export class FilteredIterable<T, U extends T> extends IterableBase<U> {
    
    static from<T, U extends T> (
        iterable: base.Iterable<T>,
        filter: (item: T) => item is U,
        id?: string | symbol,
    ): FilteredIterable<T, U>;

    static from<T> (
        iterable: base.Iterable<T>,
        filter: (item: T) => boolean,
        id?: string | symbol,
    ): FilteredIterable<T, T>;

    static from<T, U extends T> (
        iterable: base.Iterable<T>,
        filter: (item: T) => item is U,
        id?: string | symbol,
    ) { return new FilteredIterable(iterable, filter, id) }
    
    private constructor (
        private iterable: base.Iterable<T>,
        private filter: (item: T) => item is U,
        id?: string | symbol,
    ) { super(id) }

    protected build = () => new FilteredIterator(this.iterable[PreSymbol.asyncIterator](), this.filter);
}

// ----- Transform
class TransformedIterator<T, U> extends IteratorBase<U> {
    constructor (
        private iterator: base.Iterator<T>,
        private transform: (item: T) => Promise<U>,
    ) { super() }

    get size () { return this.iterator.size }

    jump (term: base.Term) { return this.iterator.jump(term)}

    async get (direction: base.Direction): base.Result<U> {
        const res = await this.iterator.get(direction);
        return (res.done)
            ? res
            : { done: false, value: await this.transform(res.value) };
    }
}

export class TransformedIterable<T, U> extends IterableBase<U> {
    constructor (
        private iterable: base.Iterable<T>,
        private transform: (item: T) => Promise<U>,
        id?: string | symbol,
    ) { super(id) }

    protected build = () => new TransformedIterator(this.iterable[PreSymbol.asyncIterator](), this.transform);
}

// ----- Recursive stack
// TODO: Can we have the stack ator/able constructors take arguments of type
// Iterable<[Hetero|Homo]Recursable> / Iterator<[Hetero|Homo]Recursor>
// to guarentee we don't build stacks out of flat Iterable/Iterator<T>?

const basicStackLoader = (iterable: base.Iterable<any>) => iterable[PreSymbol.asyncIterator]();
const StackCache = sizeable.SymbolicLRUCache.from(basicStackLoader);

// > Hetergeneous
export type HeteroStackLoader<T> = (recursable: base.HeteroRecursable<T>) => base.HeteroRecursor<T>;
type HeteroStackCache<T> = sizeable.SymbolicLRUCacheFrom<base.HeteroRecursable<T>, HeteroStackLoader<T>>;

class HeteroStackIterator<T> extends IteratorBase<T> {
    // TODO: Remove and use 'isHeteroRecursable' utility function
    private static isRecursable = <T>(x: T | base.HeteroRecursable<T>): x is base.HeteroRecursable<T> => isIterable(x);

    private stack: sizeable.Stack<base.HeteroRecursor<T>>;
    private cur: base.HeteroRecursor<T>;

    constructor (recursor: base.HeteroRecursor<T>, private loader: HeteroStackLoader<T>) {
        super();
        this.stack = new sizeable.Stack();
        this.cur = recursor;
    }

    // NOTE: Does not include possible cache size, should it?
    get size () { return this.cur.size + this.stack.size }

    jump (term: base.Term) {
        const bottom = this.stack.clear();
        if (bottom !== undefined) this.cur = bottom;
        return this.cur.jump(term);
    }

    async get (direction: base.Direction): base.Result<T> {
        const terms = base.termsOf(direction); // TODO: Only need startOf?
        
        while (true) {
            const res = await this.cur.get(direction);

            if (res.done) {
                const top = this.stack.pop();
                if (top === undefined) return res;

                this.cur = top;
                continue;
            }

            if (HeteroStackIterator.isRecursable(res.value)) {
                this.stack.push(this.cur);

                this.cur = this.loader(res.value)
                await this.cur.jump(terms.start);
                continue;
            }

            return res as SyncResult<T>;
        }
    }
}

export class HeteroStack<T> extends IterableBase<T> {
    static readonly Cache: new<T> (size: number) => HeteroStackCache<T> = StackCache;
    
    static get basicLoader (): HeteroStackLoader<any> { return basicStackLoader }
    static cachedLoader<T> (size: number): HeteroStackLoader<T> {
        const cache = new HeteroStack.Cache<T>(size);
        return recursable => cache.get(recursable);
    }

    static collate<T> (
        collatable: AsyncIterable<T | base.HeteroRecursable<T>>,
        id?: string | symbol,
    ): base.HeteroRecursable<T> { return new LazyArray(collatable, id) }

    static flatten<T> (
        recursable: base.HeteroRecursable<T>,
        loader?: HeteroStackLoader<T>,
        id?: string | symbol,
    ): HeteroStack<T>;

    static flatten<R extends base.HeteroRecursable<any>> (
        recursable: R,
        loader?: HeteroStackLoader<base.RecursiveBaseOf<R>>,
        id?: string | symbol,
    ): HeteroStack<base.RecursiveBaseOf<R>>;

    static flatten (
        recursable: base.HeteroRecursable<any>,
        loader?: HeteroStackLoader<any>,
        id?: string | symbol,
    ) { return new HeteroStack(recursable, loader, id) }

    private constructor (
        private recursable: base.HeteroRecursable<T>,
        private loader: HeteroStackLoader<T> = HeteroStack.basicLoader,
        id: string | symbol = 'pre.asyncHeteroStack',
    ) { super(id) }

    protected build = () => new HeteroStackIterator(this.recursable[PreSymbol.asyncIterator](), this.loader);
}


// > Homogeneous
type HomoCollator<T> = AsyncIterator<T | base.HomoRecursable<T>>;

class HomoCollatable<T> implements AsyncIterableIterator<base.HomoRecursable<T>> {
    // TODO: Remove and use 'isHomoRecursable' utility function
    private static isRecursable = <T>(x: T | base.HomoRecursable<T>): x is base.HomoRecursable<T> => isIterable(x);

    private loadNext: () => Promise<IteratorResult<T | base.HomoRecursable<T>, void>>;

    constructor (private collator: HomoCollator<T>) {
        this.loadNext = () => this.collator.next();
    }

    private buildLazyValue (first: T): LazyArray<T> {
        let last: IteratorResult<T | base.HomoRecursable<T>, void>;
        const genArrayItems = async function* (iter: HomoCollator<T>) {
            yield first;
            while (true) {
                last = await iter.next();
                if (last.done || HomoCollatable.isRecursable(last.value)) return;
                yield last.value;
            }
        }(this.collator);

        const res = new LazyArray(genArrayItems);
        this.loadNext = async () => {
            await res.preload();
            this.loadNext = () => this.collator.next();
            return last;
        }
        return res;
    }

    private buildValue (value: T | base.HomoRecursable<T>) {
        return (HomoCollatable.isRecursable(value)) ? value : this.buildLazyValue(value);
    }

    async next (): Promise<IteratorResult<base.HomoRecursable<T>, void>> {
        const res = await this.loadNext();
        return (res.done) ? res : { done: false, value: this.buildValue(res.value) };
    }

    [Symbol.asyncIterator] = () => this;
}

export type HomoStackLoader<T> = (recursable: base.HomoRecursable<T>) => base.HomoRecursor<T>;
type HomoStackCache<T> = sizeable.SymbolicLRUCacheFrom<base.HomoRecursable<T>, HomoStackLoader<T>>;

class HomoStackIterator<T> extends IteratorBase<T> {
    // TODO: Remove and use 'isHomoRecursable' utility function
    private static isRecursable = <T>(x: T | base.HomoRecursable<T>): x is base.HomoRecursable<T> => isIterable(x);

    private stack: sizeable.Stack<base.HomoRecursor<T>>;
    private curRecursor: base.HomoRecursor<T>;
    private curIterator: base.Iterator<T> | undefined;

    constructor (recursor: base.HomoRecursor<T>, private loader: HomoStackLoader<T>) {
        super();
        this.stack = new sizeable.Stack();
        this.curRecursor = recursor;
    }

    private async load (direction: base.Direction): base.Result<T> {
        this.curIterator = undefined; // TODO: Is this necessary?
        const terms = base.termsOf(direction); // TODO: Only need startOf?

        while (true) {
            const res = await this.curRecursor.get(direction);

            if (res.done) {
                const top = this.stack.pop();
                if (top === undefined) return res;

                this.curRecursor = top;
                continue;
            }

            if (HomoStackIterator.isRecursable(res.value)) {
                this.stack.push(this.curRecursor);

                this.curRecursor = this.loader(res.value);
                await this.curRecursor.jump(terms.start);
                continue;
            }

            this.curIterator = this.curRecursor as base.Iterator<T>;
            return res as SyncResult<T>;
        }
    }

    get size () { return this.stack.size + this.curRecursor.size }

    jump (term: base.Term) {
        this.curIterator = undefined; // TODO: Is this necessary?
        
        const bottom = this.stack.clear();
        if (bottom !== undefined) this.curRecursor = bottom;
        return this.curRecursor.jump(term);
    }

    async get (direction: base.Direction) {
        if (this.curIterator === undefined) return this.load(direction);

        const res = await this.curIterator.get(direction);
        return (res.done) ? this.load(direction) : res;
    }
}

export class HomoStack<T> extends IterableBase<T> {
    static readonly Cache: new<T> (size: number) => HomoStackCache<T> = StackCache;
    
    static get basicLoader (): HomoStackLoader<any> { return basicStackLoader }
    static cachedLoader<T> (size: number): HomoStackLoader<T> {
        const cache = new HomoStack.Cache<T>(size);
        return recursable => cache.get(recursable);
    }

    static collate<T> (
        collatable: AsyncIterable<T | base.HomoRecursable<T>>,
        id?: string | symbol,
    ): base.HomoRecursable<T> {
        const collator = collatable[Symbol.asyncIterator]();
        return new LazyArray(new HomoCollatable(collator), id);
    }

    static flatten<T> (
        recursable: base.HomoRecursable<T>,
        loader?: HomoStackLoader<T>,
        id?: string | symbol,
    ): HomoStack<T>;

    static flatten<R extends base.HomoRecursable<any>> (
        recursable: R,
        loader?: HomoStackLoader<base.RecursiveBaseOf<R>>,
        id?: string | symbol,
    ): HomoStack<base.RecursiveBaseOf<R>>;

    static flatten (
        recursable: base.HomoRecursable<any>,
        loader: HomoStackLoader<any>,
        id?: string | symbol,
    ) { return new HomoStack(recursable, loader, id) }

    constructor (
        private recursable: base.HomoRecursable<T>,
        private loader: HomoStackLoader<T> = HomoStack.basicLoader,
        id: string | symbol = 'pre.asyncHomoStack',
    ) { super(id) }

    protected build = () => new HomoStackIterator(this.recursable[PreSymbol.asyncIterator](), this.loader);
}
