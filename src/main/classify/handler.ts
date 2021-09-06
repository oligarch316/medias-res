import * as classified from '../../data/classified';

export type Context = {
    recurse: (input: Iterable<string> | AsyncIterable<string>) => classified.Recursable;
    workingDirectory: string;
};

export type Function = (
    raw: string,
    ctx: Context,
) => Promise<classified.Item | classified.Recursable | undefined>;

export interface Handler { handle: Function };
