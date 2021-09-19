import * as memoized from './memoized';
import * as types from './types';
import * as t from 'io-ts';
import * as either from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

describe('math function', () => {
    const MathSymbol = types.LiteralUnion.from([ '+', '-', '/', '*' ] as const);
    type MathSymbol = t.TypeOf<typeof MathSymbol>;

    const mathFuncs: { [K in MathSymbol]: (x: number, y: number) => number } = {
        '+': (x, y) => x + y,
        '-': (x, y) => x - y,
        '/': (x, y) => x / y,
        '*': (x, y) => x * y,
    };

    const MathFunctionCodec = memoized.fromEncode(MathSymbol, (s => mathFuncs[s]));

    test('addition', () => {
        const result = MathFunctionCodec.decode('+');
        if (either.isLeft(result)) fail(PathReporter.report(result).join(' | '));

        const f = result.right;

        expect(f(10, 2)).toEqual(12);
        expect(MathFunctionCodec.encode(f)).toEqual('+');
    });

    test('subtraction', () => {
        const result = MathFunctionCodec.decode('-');
        if (either.isLeft(result)) fail(PathReporter.report(result).join(' | '));

        const f = result.right;

        expect(f(10, 2)).toEqual(8);
        expect(MathFunctionCodec.encode(f)).toEqual('-');
    });

    test('division', () => {
        const result = MathFunctionCodec.decode('/');
        if (either.isLeft(result)) fail(PathReporter.report(result).join(' | '));

        const f = result.right;

        expect(f(10, 2)).toEqual(5);
        expect(MathFunctionCodec.encode(f)).toEqual('/');
    });

    test('multiplication', () => {
        const result = MathFunctionCodec.decode('*');
        if (either.isLeft(result)) fail(PathReporter.report(result).join(' | '));

        const f = result.right;

        expect(f(10, 2)).toEqual(20);
        expect(MathFunctionCodec.encode(f)).toEqual('*');
    });

    test('invalid', () => {
        const result = MathFunctionCodec.decode('~');
        expect(either.isLeft(result)).toBe(true);
    });
});
