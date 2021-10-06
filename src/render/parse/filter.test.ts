import * as filter from './filter';
import * as parsed from '../../data/parsed';

import { codec as codectest } from '../../common/codec/testutil';
import * as filtertest from '../../common/filter.testutil';

describe('invalid', () => {
    const invalidInputs: unknown[] = [
        { kind: 'invalid' },
        { kind: 'exact', target: 20 },
        { kind: 'prefix', prefix: 20 },
        { kind: 'suffix', suffix: 20 },
        { kind: 'regexp', pattern: 20 },
    ];

    test.each(invalidInputs)('input: %j', (input: unknown) => {
        codectest.assumeDecodeFailure(filter.Type, input);
        // TODO: Check errors?
    });
});

describe('valid', () => {
    const staticTestItemProps = {
        id: Symbol('testId'),
        data: () => Promise.reject(),
    } as const;

    const testItem = (name: string): parsed.Item => ({ name: name, ...staticTestItemProps });

    const validParams: {
        input: unknown,
        expectAccept: parsed.Item[],
        expectReject: parsed.Item[],
    }[] = [
        {
            input: { kind: 'exact', target: 'someitem' },
            expectAccept: [ testItem('otheritem') ],
            expectReject: [ testItem('someitem') ],
        },
        {
            input: { kind: 'prefix', prefix: 'someprefix' },
            expectAccept: [ testItem('otherprefixitem') ],
            expectReject: [ testItem('someprefixitem') ],
        },
        {
            input: { kind: 'suffix', suffix: 'somesuffix' },
            expectAccept: [ testItem('itemothersuffix') ],
            expectReject: [ testItem('itemsomesuffix') ],
        },
        {
            input: { kind: 'regExp', pattern: '^[0-9]+$' },
            expectAccept: [ testItem('characters') ],
            expectReject: [ testItem('12345') ],
        },
    ];

    for (const p of validParams) {
        const input = p.input;

        describe(`input: ${JSON.stringify(input)}`, () => {
            test.each(p.expectAccept)('data: %j', item => {
                const result = codectest.assumeDecodeSuccess(filter.Type, input);
                filtertest.assumeAccept(result, item);
            });
            
            test.each(p.expectReject)('data: %j', item => {
                const result = codectest.assumeDecodeSuccess(filter.Type, input);
                filtertest.assumeReject(result, item);
            });
        });
    }
});
