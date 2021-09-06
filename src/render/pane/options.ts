import * as codec from '../../common/codec';

// ----- Info
export const infoMediaModes = [ 'long', 'short' ] as const;
export const InfoMediaMode = codec.types.LiteralUnion.from(infoMediaModes, 'InfoMediaMode');
export type InfoMediaMode = codec.TypeOf<typeof InfoMediaMode>;

export const Info = codec.type({
    mediaMode: InfoMediaMode,
});

export type Info = codec.TypeOf<typeof Info>;

// ----- View
export const viewImageModes = [ 'fixed', 'panned' ] as const;
export const ViewImageMode = codec.types.LiteralUnion.from(viewImageModes, 'ViewImageMode');
export type ViewImageMode = codec.TypeOf<typeof ViewImageMode>;

export const View = codec.type({
    imageMode: ViewImageMode,
});

export type View = codec.TypeOf<typeof View>;

// ----- Display
export const Complete = codec.type({
    info: Info,
    view: View,
});

export const Incomplete = codec.partial({
    info: codec.partial(Info.props),
    view: codec.partial(View.props),
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;
