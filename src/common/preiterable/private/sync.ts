// TODO: Update to match async formula

import * as PreSymbol from './symbol';
import { Term, Direction } from './direction';
import { Result } from './common';
import { Iterable as AsyncIterable } from './async';

export * from './direction';
export { iterator as Symbol } from './symbol';
export { Result } from './common';

interface _Iterable<T> extends Iterable<T>, AsyncIterable<T> {
    readonly id: symbol;
    [PreSymbol.iterator](): _Iterator<T>;
}

interface _Iterator<T> extends Iterator<T, Term, undefined> {
    readonly size: number;
    jump (term: Term): void;
    get (direction: Direction): Result<T>;
}

export { _Iterable as Iterable, _Iterator as Iterator };

export type Recursable<T> = _Iterable<T> | _Iterable<Recursable<T>>;
export type Recursor<T> = _Iterator<T> | _Iterator<Recursable<T>>;
export type RecursiveBaseOf<T> = T extends _Iterable<infer U> ? RecursiveBaseOf<U> : T;

export type Collatable<T> = Iterable<T | Recursable<T>>;
export type Collator<T> = Iterator<T | Recursable<T>, void, undefined>;
