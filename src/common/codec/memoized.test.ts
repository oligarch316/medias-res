import * as codec from './codec';
import { codec as codectest } from './testutil';

describe('math function', () => {
    const MathSymbol = codec.literalUnion([ '+', '-', '/', '*' ] as const);
    type MathSymbol = codec.TypeOf<typeof MathSymbol>;

    const mathFuncs: { [K in MathSymbol]: (x: number, y: number) => number } = {
        '+': (x, y) => x + y,
        '-': (x, y) => x - y,
        '/': (x, y) => x / y,
        '*': (x, y) => x * y,
    };

    const MathFunctionCodec = codec.memoized.Type.fromEncode(MathSymbol, s => mathFuncs[s]);

    test('addition', () => {
        const result = codectest.assumeDecodeSuccess(MathFunctionCodec, '+');

        expect(result(10, 2)).toEqual(12);
        expect(MathFunctionCodec.encode(result)).toEqual('+');
    });

    test('subtraction', () => {
        const result = codectest.assumeDecodeSuccess(MathFunctionCodec, '-');

        expect(result(10, 2)).toEqual(8);
        expect(MathFunctionCodec.encode(result)).toEqual('-');
    });

    test('division', () => {
        const result = codectest.assumeDecodeSuccess(MathFunctionCodec, '/');

        expect(result(10, 2)).toEqual(5);
        expect(MathFunctionCodec.encode(result)).toEqual('/');
    });

    test('multiplication', () => {
        const result = codectest.assumeDecodeSuccess(MathFunctionCodec, '*');

        expect(result(10, 2)).toEqual(20);
        expect(MathFunctionCodec.encode(result)).toEqual('*');
    });

    test('invalid', () => {
        codectest.assumeDecodeFailure(MathFunctionCodec, '~');

        // TODO: Check error value / message
    });
});
