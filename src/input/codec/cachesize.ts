import * as codec from '../../common/codec';

export const primitive = codec.mergeable.partial({
    classify: codec.number,
    parse: codec.number,
    load: codec.number,
});

export const compound = codec.memoized.Type.fromEncode(
    codec.partial({ default: codec.number }),
    (a): Primitive => ({ classify: a.default, parse: a.default, load: a.default }),
);

export type Primitive = codec.TypeOf<typeof primitive>;
export type Compound = codec.TypeOf<typeof compound>;
