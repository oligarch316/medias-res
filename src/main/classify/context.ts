import * as codec from '../../common/codec';
import * as filters from '../../filters/classified';

const props = {
    workingDirectory: codec.string,
    filters: codec.array(filters.Options),
};

export const Complete = codec.type(props);
export const Incomplete = codec.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
