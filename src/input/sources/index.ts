import * as context from '../context';
import * as meta from '../meta';
import * as options from '../options';

import * as cli from './cli';
import * as config from './config';
import * as defaults from './defaults';

const contextFromWorkingDirectory = (dir: string): context.Incomplete => ({
    main: { classify: { workingDirectory: dir } },
})

export type LoadResult = {
    args: string[];
    ctx: context.Complete,
    opts: options.Complete,
};

export function load (workingDirectory: string, args: string[]): LoadResult {
    const workingDirectoryCtx = contextFromWorkingDirectory(workingDirectory);
    const cliResult = cli.load(args);
    const configPath = defaults.configPath(cliResult.meta);
    const configResult = config.load(configPath);
    const defaultsResult = defaults.load(meta.mergeTODO(
        configResult.meta,
        cliResult.meta,
    ));

    return {
        args: cliResult.args,
        ctx: context.mergeTODO(
            defaultsResult.ctx,
            configResult.ctx,
            cliResult.ctx,
            workingDirectoryCtx,
        ),
        opts: options.mergeTODO(
            defaultsResult.opts,
            configResult.opts,
            cliResult.opts,
        ),
    };
}
