import * as PreSymbol from './symbol';
import { Term, Direction } from './direction';
import { Result as BaseResult } from './common';

export * from './direction';
export { asyncIterator as Symbol } from './symbol';
export type Result<T> = Promise<BaseResult<T>>;

interface _Iterable<T> extends AsyncIterable<T> {
    readonly id: symbol;
    [PreSymbol.asyncIterator](): _Iterator<T>;
}

interface _Iterator<T> extends AsyncIterator<T, Term, undefined> {
    readonly size: number;
    jump (term: Term): Promise<void>;
    get (direction: Direction): Result<T>;

    next (): Result<T>;
    previous (): Result<T>;
}

export { _Iterable as Iterable, _Iterator as Iterator };

export type HeteroRecursable<T> = _Iterable<T | HeteroRecursable<T>>;
export type HeteroRecursor<T> = _Iterator<T | HeteroRecursable<T>>;

export type HomoRecursable<T> = _Iterable<T> | _Iterable<HomoRecursable<T>>;
export type HomoRecursor<T> = _Iterator<T> | _Iterator<HomoRecursable<T>>;

export type RecursiveBaseOf<T> = T extends _Iterable<infer U> ? RecursiveBaseOf<U> : T;
