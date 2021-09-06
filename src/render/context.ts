import * as codec from '../common/codec';
import * as parse from './parse/context';
import * as load from './load/context';

export const Complete = codec.type({
    parse: parse.Complete,
    load: load.Complete,
});

export const Incomplete = codec.partial({
    parse: parse.Incomplete,
    load: load.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
