import * as codec from '../../common/codec';

// ----- Info
export const infoMediaModes = [ 'long', 'short' ] as const;
export const InfoMediaMode = codec.literalUnion(infoMediaModes, 'InfoMediaMode');

const infoProps = {
    mediaMode: InfoMediaMode,
};

export const InfoComplete = codec.mergeable.type(infoProps);
export const InfoIncomplete = codec.mergeable.partial(infoProps);

// ----- View
export const viewImageModes = [ 'fixed', 'panned' ] as const;
export const ViewImageMode = codec.literalUnion(viewImageModes, 'ViewImageMode');

const viewProps = {
    imageMode: ViewImageMode,
};

export const ViewComplete = codec.mergeable.type(viewProps);
export const ViewIncomplete = codec.mergeable.partial(viewProps);

// ----- Display
export const Complete = codec.mergeable.type({
    info: codec.mergeable.type(infoProps),
    view: codec.mergeable.type(viewProps),
});

export const Incomplete = codec.mergeable.partial({
    info: codec.mergeable.partial(infoProps),
    view: codec.mergeable.partial(viewProps),
});

export type InfoMediaMode = codec.TypeOf<typeof InfoMediaMode>;
export type InfoComplete = codec.TypeOf<typeof InfoComplete>;
export type InfoIncomplete = codec.TypeOf<typeof InfoIncomplete>;

export type ViewImageMode = codec.TypeOf<typeof ViewImageMode>;
export type ViewComplete = codec.TypeOf<typeof ViewComplete>;
export type ViewIncomplete = codec.TypeOf<typeof ViewIncomplete>;

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
