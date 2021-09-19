import * as codec from '../common/codec';
import * as classify from './classify/options';
import * as pane from './pane/options';
import * as log from './log/options';

const props = {
    newInstance: codec.boolean,
};

export const Complete = codec.mergeable.type({
    classify: classify.Complete,
    pane: pane.Complete,
    log: log.Complete,
    ...props,
});

export const Incomplete = codec.mergeable.partial({
    classify: classify.Incomplete,
    pane: pane.Incomplete,
    log: log.Incomplete,
    ...props,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
