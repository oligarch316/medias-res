import * as cachesize from './cachesize';
import { codec as codectest } from '../../common/codec/testutil';

describe('primitive', () => {
    const c = cachesize.primitive;

    describe('invalid', () => {
        const invalidInputs: unknown[] = [
            { classify: 'invalid' },
            { parse: 'invalid' },
            { load: 'invalid' },
        ];

        test.each(invalidInputs)('input: %j', (input: unknown) => {
            codectest.assumeDecodeFailure(c, input);
            // TODO: Check errors?
        });
    });

    describe('valid', () => {
        const validParams: { input: unknown, expected: object }[] = [
            {
                input: {},
                expected: { classify: undefined, parse: undefined, load: undefined },
            },
            {
                input: { classify: 10, parse: 20, load: 30 },
                expected: { classify: 10, parse: 20, load: 30 },
            },
        ];

        for (const p of validParams) {
            test(`input: ${JSON.stringify(p.input)}`, () => {
                const result = codectest.assumeDecodeSuccess(c, p.input);
                expect(result).toEqual(p.expected);

                const output = c.encode(result);
                expect(output).toEqual(p.input);
            });
        }
    });
});

describe('compound', () => {
    const c = cachesize.compound;

    describe('invalid', () => {
        const invalidInputs: unknown[] = [
            { default: 'invalid' },
        ];

        test.each(invalidInputs)('input: %j', (input: unknown) => {
            codectest.assumeDecodeFailure(c, input);
            // TODO: Check errors?
        });
    });

    describe('valid', () => {
        const validParams: { input: unknown, expected: object }[] = [
            {
                input: {},
                expected: { classify: undefined, parse: undefined, load: undefined },
            },
            {
                input: { default: 10 },
                expected: { classify: 10, parse: 10, load: 10 },
            },
        ];

        for (const p of validParams) {
            test(`input: ${JSON.stringify(p.input)}`, () => {
                const result = codectest.assumeDecodeSuccess(c, p.input);
                expect(result).toMatchObject(p.expected);

                const output = c.encode(result);
                expect(output).toEqual(p.input);
            });
        }
    });
});
