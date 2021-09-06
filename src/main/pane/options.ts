import * as codec from '../../common/codec';

const props = {
    width: codec.number, // TODO: type w/ units
    height: codec.number, // TODO: type w/ units
};

export const Complete = codec.type(props);
export const Incomplete = codec.partial(props);

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
