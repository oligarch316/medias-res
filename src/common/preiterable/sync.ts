// TODO: Update to match async formula

import * as sizeable from '../sizeable';
import * as PreSymbol from './private/symbol';
import * as common from './private/common';
import * as base from './private/sync';
import { wrap as wrapAsync } from './async';

// ----- Re-export
export * from './private/sync';

// ----- Abstract bases
export abstract class IterableBase<T> extends common.Iterable<base.Result<T>, void> implements base.Iterable<T> {
    constructor (id: string | symbol = 'pre.iterable') { super(id) }

    [Symbol.asyncIterator] = () => this[PreSymbol.asyncIterator]();
    [PreSymbol.asyncIterator] = () => wrapAsync(this[PreSymbol.iterator]());

    [Symbol.iterator] = () => this[PreSymbol.iterator]();
    [PreSymbol.iterator] = () => this.build();
}

export abstract class IteratorBase<T> extends common.Iterator<base.Result<T>, void> implements base.Iterator<T> {};

// ----- Utility functions
export function isIterable<T> (x: Iterable<T>): x is base.Iterable<T>;
export function isIterable (x: any): x is base.Iterable<any>;
export function isIterable (x: any): x is base.Iterable<any> {
    return (x as base.Iterable<any>)[PreSymbol.iterator] !== undefined;
}

function isRecursable<T> (x: T | base.Recursable<T>): x is base.Recursable<T> { return isIterable(x) }

// ----- Basic array
class _Array<T> extends IterableBase<T> {
    constructor (protected data: T[], id: string | symbol = 'pre.array') { super(id) }
    protected build () { return new common.ArrayIterator(this.data) }
}

export { _Array as Array };

// ----- Mixed collation
class MixedIterator<T> implements IterableIterator<base.Recursable<T>> {
    private loadNext: () => IteratorResult<T | base.Recursable<T>, void>;

    constructor (private collator: base.Collator<T>) { this.loadNext = () => this.collator.next() }

    private buildLazyValue (first: T): LazyArray<T> {
        let last: IteratorResult<T | base.Recursable<T>, void>;
        const genArrayItems = function* (iter: base.Collator<T>) {
            yield first;
            while (true) {
                last = iter.next();
                if (last.done || isRecursable(last.value)) return;
                yield last.value;
            }
        }(this.collator);

        const res = new LazyArray(genArrayItems);
        this.loadNext = () => {
            res.preload();
            this.loadNext = () => this.collator.next();
            return last;
        }
        return res;
    }

    private buildValue (value: T | base.Recursable<T>) {
        return (isRecursable(value)) ? value : this.buildLazyValue(value);
    }

    next (): IteratorResult<base.Recursable<T>, void> {
        const res = this.loadNext();
        return (res.done) ? res : { done: false, value: this.buildValue(res.value) };
    }

    [Symbol.iterator] = () => this;
}

// ----- Lazy array
type LazyLoader<T> = common.LazyLoader<base.Result<T>, void>;

class LazyArrayIterator<T> extends common.ArrayIterator<T> {
    constructor (data: T[], private loader: LazyLoader<T>) { super(data) }

    private markComplete () {
        this.jump = super.jump;
        this.get = super.get;
    }

    private loadNext () {
        const res = this.loader.next();
        if (res.done) this.markComplete();
        return res;
    }

    private loadAll () {
        this.loader.all();
        this.markComplete();
    }

    jump (term: base.Term) {
        if (term === 'EOD') this.loadAll();
        return super.jump(term);
    }

    get (direction: base.Direction) {
        const res = super.get(direction);
        return (res.done && direction == 'next') ? this.loadNext() : res;
    }
}

export class LazyArray<T> extends _Array<T> {
    static collate<T> (collatable: base.Collatable<T>, id: string | symbol = 'pre.lazyArray') {
        const collator: base.Collator<T> = collatable[Symbol.iterator]();
        return new LazyArray(new MixedIterator(collator), id);
    }

    private iter: Iterator<T> | undefined;

    constructor (iterable: Iterable<T>, id?: string | symbol) {
        super([], id);
        this.iter = iterable[Symbol.iterator]();
    }

    private loadNext (): base.Result<T> {
        if (this.iter === undefined) return { done: true, value: 'EOD' };

        const res = this.iter.next();
        if (res.done) {
            this.iter = undefined
        } else {
            this.data.push(res.value);
        }
        return res;
    }

    private loadAll () {
        for (let x = this.loadNext(); !x.done; x = this.loadNext());
    }

    private loader = {
        next: () => this.loadNext(),
        all: () => this.loadAll(),
    };

    protected build () {
        return (this.complete) ? super.build() : new LazyArrayIterator(this.data, this.loader);
    }

    get complete () { return this.iter === undefined }
    preload () { this.loadAll() }
}

export const collate = LazyArray.collate;

// ----- Recursive stack
export type StackLoader<T> = (recursable: base.Recursable<T>) => base.Recursor<T>;

class StackIterator<T> extends IteratorBase<T> {
    private stack: sizeable.Stack<base.Recursor<T>>;
    private curIterator: base.Iterator<T> | undefined;
    private get top () { return this.stack.top ?? this.baseRecursor }

    constructor (private baseRecursor: base.Recursor<T>, private loader: StackLoader<T>) {
        super();
        this.stack = new sizeable.Stack();
    }

    private load (direction: base.Direction): base.Result<T> {
        const terms = base.termsOf(direction);

        let curRecursor = this.top;
        while (true) {
            const res = curRecursor.get(direction);

            // res === IteratorReturnResult
            if (res.done) {
                // If this.stack was empty, curRecursor is this.base and we're done
                if (this.stack.pop() === undefined) {
                    return { done: true, value: terms.done };
                }

                // Otherwise set curRecursor to new top (post-stack.pop) and continue
                curRecursor = this.top;
                continue;
            }

            // res === IteratorYieldResult of Recursable<T>
            if (isRecursable(res.value)) {
                // Create recursor from recursable value, jump to
                // appropriate start term and set as curRecursor
                curRecursor = this.loader(res.value);
                curRecursor.jump(terms.start);

                // Push to stack and continue
                this.stack.push(curRecursor);
                continue
            }

            // res === IteratorYieldResult of T
            // implies ==> curRecursor is a direct Iterator<T> and res is Result<T>
            this.curIterator = curRecursor as base.Iterator<T>;
            return res as base.Result<T>;
        }
    }

    // NOTE: Does not include possible cache size, should it?
    get size () { return this.baseRecursor.size + this.stack.size }

    jump (term: base.Term) {
        this.stack.clear();
        this.baseRecursor.jump(term);
    }

    get (direction: base.Direction) {
        const res = this.curIterator?.get(direction);
        return (res === undefined || res.done) ? this.load(direction) : res;
    }
}

export type StackCache<T> = sizeable.SymbolicLRUCache<base.Recursable<T>, base.Recursor<T>, base.Recursor<T>>;

export class Stack<T> extends IterableBase<T> {
    static basicLoader: StackLoader<any> = recursable => recursable[PreSymbol.iterator]();

    static readonly Cache: new<T> (size: number) => StackCache<T> = sizeable.SymbolicLRUCache.from(Stack.basicLoader);
    
    static cachedLoader<T> (size: number): StackLoader<T> {
        const cache = new Stack.Cache<T>(size);
        return recursable => cache.get(recursable);
    }

    static flatten<T> (
        recursable: base.Recursable<T>,
        loader?: StackLoader<T>,
        id?: string | symbol,
    ): Stack<T>;

    static flatten<R extends base.Recursable<any>> (
        recursable: R,
        loader?: StackLoader<base.RecursiveBaseOf<R>>,
        id?: string | symbol,
    ): Stack<base.RecursiveBaseOf<R>>;

    static flatten (
        recursable: base.Recursable<any>,
        loader: StackLoader<any> = Stack.basicLoader,
        id?: string | symbol,
    ) { return new Stack(recursable, loader, id) }

    private constructor (
        private recursable: base.Recursable<T>,
        private loader: StackLoader<T>,
        id: string | symbol = 'pre.stack',
    ) { super(id) }

    protected build () { return new StackIterator(this.recursable[PreSymbol.iterator](), this.loader) }
}

export const flatten = Stack.flatten;

// function x () {
//     const myArray = [ 'one', 'two', 'three' ];
//     const myGen = function* (): Generator<string, void, undefined> {
//         yield 'one';
//         yield 'two';
//         yield 'three';
//     }

//     const a = new _Array(myArray);
//     const b = new LazyArray(myGen());
//     const c = new _Array<base.Iterable<string>>([a, b,]);

//     const byoCache = new Stack.Cache<string>(10);
//     const d = Stack.flatten(c);
//     const e = Stack.flatten(c, Stack.basicLoader);
//     const f = Stack.flatten(c, Stack.cachedLoader(10));
//     const g = Stack.flatten(c, r => byoCache.get(r));

//     let thing: base.Recursable<string>;
//     const h = Stack.flatten(thing);
// }
