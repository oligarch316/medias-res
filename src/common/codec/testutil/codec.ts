import * as t from 'io-ts';
import * as validation from './valiation';

const reportIsNot = (c: t.Any) => new Error(`is not ${c.name}`);

export const assertIs = <A>(c: t.Type<A, any, any>, u: unknown): u is A => c.is(u);

export function requireIs<A> (c: t.Type<A, any, any>, u: unknown): asserts u is A {
    if (!assertIs(c, u)) fail(reportIsNot(c));
}

export const assumeDecodeSuccess = <A, I>(c: t.Type<A, any, I>, input: I) => validation.assumeRight(c.decode(input));
export const assumeDecodeFailure = <A, I>(c: t.Type<A, any, I>, input: I) => validation.assumeLeft(c.decode(input));

export const validateSuccess = <A, I>(
    c: t.Type<A, any, I>,
    input: I,
    context: t.Context,
) => validation.assumeRight(c.validate(input, context));

export const validateFailure = <A, I>(
    c: t.Type<A, any, I>,
    input: I,
    context: t.Context,
) => validation.assumeLeft(c.validate(input, context));

