import type * as context from '../context';
import type * as options from '../options';

import * as codec from '../../common/codec';
import * as log from '../../main/log/options';
import * as meta from '../meta';

import * as either from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter'

const modeFlag = codec.cli.singleArgFlag(meta.Mode.fromString);
const filePathFlag = codec.cli.singleArgFlag(codec.types.FilePathFromString);

const flagSet = {
    '--config': filePathFlag,
    '--log-level': codec.cli.singleArgFlag(log.Level.fromString),
    '--log-format': codec.cli.singleArgFlag(log.Format.fromString),
    '--log-output': codec.cli.singleArgFlag(log.Output.fromString),
    '--mode': modeFlag,
    '--new-window': codec.cli.booleanFlag,
    '--recurse': codec.cli.booleanFlag,
    // TODO: Filters
};

const Command = codec.cli.command(flagSet, 'medias-res');

type Command = codec.TypeOf<typeof Command>;
type Flags = Command['flags'];

function encodeMeta (flags: Flags): meta.Meta {
    return {
        configPath: flags['--config'],
        mode: flags['--mode'],
    };
}

function encodeContext (flags: Flags): context.Incomplete {
    // TODO: Filters

    return {
        render: {
            parse: { recurse: flags['--recurse'] },
        },
    };
}

function encodeOptions (flags: Flags): options.Incomplete {
    return {
        main: {
            log: {
                level: flags['--log-level'],
                format: flags['--log-format'],
                output: flags['--log-output'],
            },
            newInstance: flags['--new-window'],
        },
    };
}

export type LoadResult = {
    args: string[],
    ctx: context.Incomplete,
    meta: meta.Meta,
    opts: options.Incomplete,
};

export function load (args: string[]): LoadResult {
    const eitherCommand = Command.decode(args);

    if (either.isLeft(eitherCommand)) {
        // TODO: Error handling/messaging
        throw new Error(PathReporter.report(eitherCommand).join(' | '))
    }

    return {
        args: eitherCommand.right.args,
        ctx: encodeContext(eitherCommand.right.flags),
        meta: encodeMeta(eitherCommand.right.flags),
        opts: encodeOptions(eitherCommand.right.flags),
    };
}
