import * as codec from '../common/codec';

export const modes = [ 'dev', 'prod' ] as const;
export const Mode = codec.types.LiteralUnion.from(modes, 'Mode');
export type Mode = codec.TypeOf<typeof Mode>;

export type Meta = Partial<{
    configPath: string,
    mode: Mode,
}>;

export function mergeTODO (base: Meta, ...list: Meta[]) {
    // TODO
    return base;
}
