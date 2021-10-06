import * as filter from './filter';
import * as loaded from '../../data/loaded';
import * as mime from '../../data/mime';

import { codec as codectest } from '../../common/codec/testutil';
import * as filtertest from '../../common/filter.testutil';

describe('invalid', () => {
    const invalidInputs: unknown[] = [
        { kind: 'invalid' },
        { kind: 'mimeType', mimeType: 'invalid' },
        { kind: 'mimeSubtype', mimeSubtype: 'invalid' },
    ];

    test.each(invalidInputs)('input: %j', (input: unknown) => {
        codectest.assumeDecodeFailure(filter.Type, input);
        // TODO: Check errors?
    });
});

describe('valid', () => {
    const staticTestItemProps = {
        id: Symbol('testId'),
        name: 'testName',
        size: 20,
        objectURL: 'testObjectURL',
    } as const;

    const testItem = (m: mime.Data): loaded.Item => ({ mime: m, ...staticTestItemProps });

    const validParams: {
        input: unknown,
        expectAccept: loaded.Item[],
        expectReject: loaded.Item[],
    }[] = [
        {
            input: { kind: 'mimeType', mimeType: 'image' },
            expectAccept: [ testItem({ type: 'video', subtype: 'mpeg4' }) ],
            expectReject: [ testItem({ type: 'image', subtype: 'jpeg' }) ],
        },
        {
            input: { kind: 'mimeSubtype', mimeSubtype: 'png' },
            expectAccept: [ testItem({ type: 'image', subtype: 'jpeg' }) ],
            expectReject: [ testItem({ type: 'image', subtype: 'png' }) ],
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
