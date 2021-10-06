import * as codec from '../../common/codec';
import * as filter from './filter';

import * as classify from '../../main/classify/filter';
import * as parse from '../../render/parse/filter';
import * as load from '../../render/load/filter';

import {
    codec as codectest,
    array as arraytest,
    partial as partialtest,
} from '../../common/codec/testutil';

describe('primitive', () => {
    const c = filter.primitive;

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
        type ValidCase = { inputItem: unknown, expectedC: codec.Any };
        
        const validParams: { [stage in keyof filter.Primitive]-?: ValidCase[] } = {
            classify: [
                {
                    inputItem: { kind: 'exact', target: 'someitem' },
                    expectedC: classify.exact,
                },
                {
                    inputItem: { kind: 'prefix', prefix: 'someprefix' },
                    expectedC: classify.prefix,
                },
                {
                    inputItem: { kind: 'suffix', suffix: 'somesuffix' },
                    expectedC: classify.suffix,
                },
                {
                    inputItem: { kind: 'regExp', pattern: 'somepattern' },
                    expectedC: classify.regExp,
                },
            ],
            parse: [
                {
                    inputItem: { kind: 'exact', target: 'someitem' },
                    expectedC: parse.exact,
                },
                {
                    inputItem: { kind: 'prefix', prefix: 'someprefix' },
                    expectedC: parse.prefix,
                },
                {
                    inputItem: { kind: 'suffix', suffix: 'somesuffix' },
                    expectedC: parse.suffix,
                },
                {
                    inputItem: { kind: 'regExp', pattern: 'somepattern' },
                    expectedC: parse.regExp,
                },
            ],
            load: [
                {
                    inputItem: { kind: 'mimeType', mimeType: 'image' },
                    expectedC: load.mimeType,
                },
                {
                    inputItem: { kind: 'mimeSubtype', mimeSubtype: 'png' },
                    expectedC: load.mimeSubtype,
                },
            ],
        };

        for (const [stage, cases] of Object.entries(validParams)) {
            describe(stage, () => {
                for (const p of cases) {
                    test(`input: ${JSON.stringify(p.inputItem)}`, () => {
                        const input = { [stage]: [ p.inputItem ] };

                        const result = codectest.assumeDecodeSuccess(c, input);
                        partialtest.requireKeys(result, stage as keyof filter.Primitive);

                        const resultItem = arraytest.assumeIndex(result[stage] as unknown[], 0);
                        codectest.requireIs(p.expectedC, resultItem);

                        const output = c.encode(result);
                        expect(output).toEqual(input);
                    });
                }
            });
        }
    });
});

describe('compound', () => {
    const c = filter.compound;

    describe('invalid', () => {
        const invalidInputs: unknown[] = [
            { any: 'invalid' },
            { any: [ { kind: 'invalid' } ] },
            { any: [ { kind: 'exact', target: 20 } ] },
            { any: [ { kind: 'prefix', prefix: 20 } ] },
            { any: [ { kind: 'suffix', suffix: 20 } ] },
            { any: [ { kind: 'regExp', pattern: 20 } ] },
            { any: [ { kind: 'mimeType', mimeType: 'invalid' } ] },
            { any: [ { kind: 'mimeSubtype', mimeSubtype: 'invalid' } ] },
            { any: [ { kind: 'extension', extension: 20 } ] },
        ];

        test.each(invalidInputs)('input: %j', (input: unknown) => {
            codectest.assumeDecodeFailure(c, input);
            // TODO: Check errors?
        });
    });

    describe('valid', () => {
        const todoKinds = [
            'exact',
            'prefix',
            'suffix',
            'regExp',
            'mimeType',
            'mimeSubtype',
            'hidden',
            'hiddenMacOS',
            'images',
            'videos',
            'extension',
        ];

        for (const kind of todoKinds) test.todo(kind);
    });
});
