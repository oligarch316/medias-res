import * as codec from '../../common/codec';
import * as common from '../../common/log';

// TODO: Really want array of { output: ..., format: ... } pairs
// One such could/should also be "console", consumed only by renderer logger

export { Level } from '../../common/log';

export const formats = [
    'json',
] as const;

export const Format = codec.types.LiteralUnion.from(formats, 'LogFormat');
export type Format = codec.TypeOf<typeof Format>;

export const outputs = [
    'stdout',
    'stderr',
] as const;

export const Output = codec.types.LiteralUnion.from(outputs, 'LogOutput');
export type Output = codec.TypeOf<typeof Output>;

const props = {
    level: common.Level,
    format: Format,
    output: Output,
};

export const Complete = codec.type(props);
export const Incomplete = codec.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
