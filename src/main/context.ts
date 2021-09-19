import * as codec from '../common/codec';
import * as classify from './classify/context';

export const Complete = codec.mergeable.type({
    classify: classify.Complete,
});

export const Incomplete = codec.mergeable.partial({
    classify: classify.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
