import * as codec from '../../common/codec';
import * as filters from '../../filters/loaded';

const props = {
    filters: codec.mergeable.array(filters.Options), // TODO: Make more "set-like"
};

export const Complete = codec.mergeable.type(props);
export const Incomplete = codec.mergeable.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
