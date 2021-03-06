import * as codec from '../../common/codec';
import * as common from '../../common/log';

// TODO: Really want array of { output: ..., format: ... } pairs
// One such could/should also be "console", consumed only by renderer logger

export { Level } from '../../common/log';

export const formats = [
    'json',
] as const;

export const Format = codec.literalUnion(formats, 'LogFormat');
export type Format = codec.TypeOf<typeof Format>;

export const outputs = [
    'stdout',
    'stderr',
] as const;

export const Output = codec.literalUnion(outputs, 'LogOutput');
export type Output = codec.TypeOf<typeof Output>;

const props = {
    level: common.Level,
    format: Format,
    output: Output,
};

export const Complete = codec.mergeable.type(props);
export const Incomplete = codec.mergeable.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
