import * as t from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';

import * as mergeable from './mergeable';

const sym: unique symbol = Symbol('memo');

export type Memo<T> = { [sym]: T };
export type MemoOf<T> = T extends Memo<infer U> ? U : never;

const isMemoized = (u: unknown): u is Memo<any> =>
    (typeof u === 'object' || typeof u === 'function') &&
    u !== null &&
    u[sym] !== undefined;

export class Type<A extends object, M, O, I> extends t.Type<A & Memo<M>, O, I> {
    readonly _tag: 'MemoizedType' = 'MemoizedType';

    private static wrap = <A, M>(a: A, m: M): A & Memo<M> => Object.assign(a, { [sym]: m });
    private static unwrap = <M>(x: Memo<M>): M => x[sym];

    constructor (
        name: string,
        is: Type<A, M, O, I>['is'],
        validate: Type<A, M, O, I>['validate'],
        encode: Type<A, M, O, I>['encode'],
        readonly memo: t.Type<M, O, I>,
        readonly validateMemo: t.Validate<M, A & Memo<M>>,
    ) { super(name, is, validate, encode) }

    static fromValidate<A extends object, C extends t.Any> (
        memo: C,
        validate: t.Validate<t.TypeOf<C>, A>,
        name = `Memoized<${memo.name}>`,
    ) {
        const validateMemo = (m: t.TypeOf<C>, c: t.Context) => pipe(
            validate(m, c),
            chain(a => t.success(Type.wrap(a, m))),
        );
        
        return new Type<A, t.TypeOf<C>, t.OutputOf<C>, t.InputOf<C>>(
            name,
            (u: unknown): u is A & Memo<t.TypeOf<C>> => isMemoized(u) && memo.is(u[sym]),
            (i, c) => pipe(memo.validate(i, c), chain(m => validateMemo(m, c))),
            a => memo.encode(Type.unwrap(a)),
            memo,
            validateMemo,
        );
    };

    static readonly fromEncode = <A extends object, C extends t.Any> (
        memo: C,
        encode: t.Encode<t.TypeOf<C>, A>,
        name?: string,
    ) => Type.fromValidate(memo, i => t.success(encode(i)), name);

    static readonly fromMemoOutput = <C extends t.Type<any, object, any>>(memo: C, name?: string) => {
        const tmpCodec = new t.Type<t.TypeOf<C>, t.TypeOf<C>, t.InputOf<C>>(
            memo.name, memo.is, memo.validate, t.identity,
        );
        return Type.fromEncode<t.OutputOf<C>, typeof tmpCodec>(tmpCodec, memo.encode, name);
    };
}

export interface C<A extends object, M, O, I> extends Type<A, M, O, I> {};

export const isMemoizedC = (codec: t.Any): codec is C<object, any, any, any> => (codec as any)._tag === 'MemoizedType';

export const merged = <A extends object, M, BaseO, ExtraO>(
    base: t.Type<A, BaseO, unknown>,
    extra: Type<A, M, ExtraO, unknown>,
    merge: mergeable.Function<A>,
    name?: string,
) => Type.fromValidate(
    t.intersection([ base, extra.memo ]),
    (i, c) => pipe(
        extra.validateMemo(i, c),
        chain(extraI => t.success(merge(i, extraI))),
    ),
    name,
);

export const mergedFrom = <A extends object, M, BaseO, ExtraO>(
    base: mergeable.Type<A, BaseO, unknown>,
    extra: Type<A, M, ExtraO, unknown>,
    priority: 'priorityBase' | 'priorityExtra',
    name?: string,
) => {
    const mergeFunc = (priority === 'priorityBase')
        ? mergeable.reversePriority(base.merge)
        : base.merge;

    return merged(base, extra, mergeFunc, name);
};
