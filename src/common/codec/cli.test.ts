import * as t from 'io-ts';
import * as either from 'fp-ts/Either';
import * as cli from './cli';

import { PathReporter } from 'io-ts/PathReporter'

const testFlags = {
    '--testBoolOne': cli.booleanFlag,
    '--testBoolTwo': cli.booleanFlag,
    '--testStringOne': cli.stringFlag,
    '--testStringTwo': cli.stringFlag,
    '--testNumberOne': cli.numberFlag,
    '--testNumberTwo': cli.numberFlag,
    '--testIntegerOne': cli.integerFlag,
    '--testIntegerTwo': cli.integerFlag,
};

const TestCommand = cli.command(testFlags, 'testCommand');
type TestCommand = t.TypeOf<typeof TestCommand>;

function decode (input: string[], expected: TestCommand) {
    const result = TestCommand.decode(input);
    // if (either.isLeft(result)) throw new Error ('TODO: Validation error');
    if (either.isLeft(result)) throw new Error(PathReporter.report(result).join(' | '));
    expect(result.right).toEqual(expected);
}

describe('decode', () => {
    test('arguments only', () => decode(
        [ 'valueOne', 'valueTwo', 'valueThree' ],
        {
            args: [ 'valueOne', 'valueTwo', 'valueThree' ],
            flags: {},
        },
    ));

    test('boolean flags only', () => decode(
        [ '--testBoolOne', '--testBoolTwo', 'false' ],
        {
            args: [],
            flags: {
                '--testBoolOne': true,
                '--testBoolTwo': false,
            },
        },
    ));

    test('number failure', () => decode(
        [ '--testNumberOne', 'eleven' ],
        {
            args: [],
            flags: {},
        },
    ));
});

// test('only arguments', () => {
//     const input = [ 'valueOne', 'valueTwo', 'valueThree' ];
//     const eitherResult = TestCommand.decode(input);

//     if (either.isLeft(eitherResult)) {
//         throw new Error('TODO: Validation failure, print error');
//     }

//     expect(eitherResult.right).toEqual({
//         args: input,
//         flags: {},
//     });
// });