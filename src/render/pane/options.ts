import * as codec from '../../common/codec';

// ----- Info
export const infoMediaModes = [ 'long', 'short' ] as const;
export const InfoMediaMode = codec.types.LiteralUnion.from(infoMediaModes, 'InfoMediaMode');

const infoProps = {
    mediaMode: InfoMediaMode,
};

// ----- View
export const viewImageModes = [ 'fixed', 'panned' ] as const;
export const ViewImageMode = codec.types.LiteralUnion.from(viewImageModes, 'ViewImageMode');

const viewProps = {
    imageMode: ViewImageMode,
};

// ----- Display
export const Complete = codec.mergeable.type({
    info: codec.mergeable.type(infoProps),
    view: codec.mergeable.type(viewProps),
});

export const Incomplete = codec.mergeable.partial({
    info: codec.mergeable.partial(infoProps),
    view: codec.mergeable.partial(viewProps),
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
