import * as t from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';

const sym: unique symbol = Symbol('memo');
type Memo<T> = { [sym]: T };

const isMemoized = (u: unknown): u is Memo<any> =>
    (typeof u === 'object' || typeof u === 'function') &&
    u !== null &&
    u[sym] !== undefined;

export class Type<A extends object, M, O, I> extends t.Type<A & Memo<M>, O, I> {
    readonly _tag: 'MemoizedType' = 'MemoizedType';

    constructor (
        name: string,
        is: Type<A, M, O, I>['is'],
        validate: Type<A, M, O, I>['validate'],
        encode: Type<A, M, O, I>['encode'],
        readonly memo: t.Type<M, O, I>,
        readonly validateMemo: t.Validate<M, A>,
    ) { super(name, is, validate, encode) }

    static from = <A extends object, M, O, I>(
        memo: t.Type<M, O, I>,
        validateMemo: t.Validate<M, A>,
        name = `Memoized<${memo.name}>`,
    ) => new Type<A, M, O, I>(
        name,
        (u: unknown): u is A & Memo<M> => isMemoized(u) && memo.is(u[sym]),
        (i, c) => pipe(
            memo.validate(i, c),
            chain(m => pipe(
                validateMemo(m, c),
                chain(a => t.success(Object.assign(a, { [sym]: m }))),
            )),
        ),
        a => memo.encode(a[sym]),
        memo,
        validateMemo,
    );
}

export interface C<A extends object, M, O, I> extends Type<A, M, O, I> {};

export const isMemoizedC = (codec: t.Any): codec is C<object, any, any, any> => (codec as any)._tag === 'MemoizedType';

export const fromValidate = <A extends object, C extends t.Any>(
    memo: C,
    validate: t.Validate<t.TypeOf<C>, A>,
    name?: string,
) => Type.from<A, t.TypeOf<C>, t.OutputOf<C>, t.InputOf<C>>(memo, validate, name);

export const fromEncode = <A extends object, C extends t.Any> (
    memo: C,
    encode: t.Encode<t.TypeOf<C>, A>,
    name?: string,
) => fromValidate(memo, i => t.success(encode(i)), name);

export const fromDecoder = <A extends object, C extends t.Any> (
    memo: C,
    decoder: t.Decoder<t.TypeOf<C>, A>,
    name?: string,
) => fromValidate(memo, decoder.validate, name);

export const fromEncoder = <A extends object, C extends t.Any> (
    memo: C,
    encoder: t.Encoder<t.TypeOf<C>, A>,
    name?: string,
) => fromEncode(memo, encoder.encode, name);

export const fromMemoOutput = <C extends t.Type<any, object, any>>(memo: C, name?: string) => {
    const tmpCodec = new t.Type<t.TypeOf<C>, t.TypeOf<C>, t.InputOf<C>>(
        memo.name, memo.is, memo.validate, t.identity,
    );
    return fromEncode<t.OutputOf<C>, typeof tmpCodec>(tmpCodec, memo.encode, name);
};
