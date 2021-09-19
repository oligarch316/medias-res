import * as codec from './codec';

export const levels = [
    'error',
    'warn',
    'info',
    'debug',
] as const;

export const Level = codec.literalUnion(levels, 'LogLevel');
export type Level = codec.TypeOf<typeof Level>;

export type Logger =
    { [K in Level]: (message: any) => void } &
    { log: (level: Level, message: any) => void };
