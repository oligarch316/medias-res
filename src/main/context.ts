import * as codec from '../common/codec';
import * as classify from './classify/context';

export const Complete = codec.type({
    classify: classify.Complete,
});

export const Incomplete = codec.partial({
    classify: classify.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
