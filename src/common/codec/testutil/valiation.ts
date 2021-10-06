import * as t from 'io-ts';
import * as either from 'fp-ts/Either';
import { failure as validationErrorsToString } from 'io-ts/PathReporter';

const reportUnexpectedLeft = (e: t.Errors) => new Error(`unexpected left validation: ${validationErrorsToString(e).join(' -|- ')}`);
const reportUnexpectedRight = (a: any) => new Error('unexpected right validation: TODO');

export const assertLeft = (v: t.Validation<any>): v is either.Left<t.Errors> => either.isLeft(v);
export const assertRight = <A>(v: t.Validation<A>): v is either.Right<A> => either.isRight(v);

export function requireLeft (v: t.Validation<any>): asserts v is either.Left<t.Errors> {
    if (assertRight(v)) fail(reportUnexpectedRight(v.right));
}

export function requireRight<A> (v: t.Validation<A>): asserts v is either.Right<A> {
    if (assertLeft(v)) fail(reportUnexpectedLeft(v.left));
}

export const assumeLeft = (v: t.Validation<any>) => { requireLeft(v); return v.left };
export const assumeRight = <A>(v: t.Validation<A>) => { requireRight(v); return v.right };
