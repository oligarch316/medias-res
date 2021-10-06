import * as filter from './filter';
import * as classified from '../../data/classified';

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
    const validParams: {
        input: unknown,
        expectAccept: classified.Item[],
        expectReject: classified.Item[],
    }[] = [
        {
            input: { kind: 'exact', target: 'someitem' },
            expectAccept: [ { protocol: 'fs', type: 'file', urlString: 'otheritem' } ],
            expectReject: [ { protocol: 'fs', type: 'file', urlString: 'someitem' } ],
        },
        {
            input: { kind: 'prefix', prefix: 'someprefix' },
            expectAccept: [ { protocol: 'fs', type: 'file', urlString: 'otherprefixitem' } ],
            expectReject: [ { protocol: 'fs', type: 'file', urlString: 'someprefixitem' } ],
        },
        {
            input: { kind: 'suffix', suffix: 'somesuffix' },
            expectAccept: [ { protocol: 'fs', type: 'file', urlString: 'itemothersuffix' } ],
            expectReject: [ { protocol: 'fs', type: 'file', urlString: 'itemsomesuffix' } ],
        },
        {
            input: { kind: 'regExp', pattern: '^[0-9]+$' },
            expectAccept: [ { protocol: 'fs', type: 'file', urlString: 'characters' } ],
            expectReject: [ { protocol: 'fs', type: 'file', urlString: '12345' } ],
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
