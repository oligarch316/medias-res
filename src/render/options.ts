import * as codec from '../common/codec';
import * as parse from './parse/options';
import * as load from './load/options';
import * as pane from './pane/options';

export const Complete = codec.mergeable.type({
    parse: parse.Complete,
    load: load.Complete,
    pane: pane.Complete,
});

export const Incomplete = codec.mergeable.partial({
    parse: parse.Incomplete,
    load: load.Incomplete,
    pane: pane.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
