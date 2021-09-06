import * as codec from '../common/codec';
import * as classify from './classify/options';
import * as pane from './pane/options';

export const Complete = codec.type({
    classify: classify.Complete,
    pane: pane.Complete,
});

export const Incomplete = codec.partial({
    classify: classify.Incomplete,
    pane: pane.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
