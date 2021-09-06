import * as codec from '../../common/codec';
import * as filters from '../../filters/parsed';

const props = {
    recurse: codec.boolean,
    filters: codec.array(filters.Options), // TODO: Make more "set-like"
};

export const Complete = codec.type(props);
export const Incomplete = codec.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
