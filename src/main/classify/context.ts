import * as codec from '../../common/codec';
import * as filters from '../../filters/classified';

const props = {
    workingDirectory: codec.string,
    filters: codec.mergeable.array(filters.Options),
};

export const Complete = codec.mergeable.type(props);
export const Incomplete = codec.mergeable.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
