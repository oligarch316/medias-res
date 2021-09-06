import * as codec from '../common/codec';
import * as mime from '../data/mime';

export const Exact = codec.type({
    type: codec.literal('exact'),
    target: codec.types.NonEmptyString,
}, 'FilterExact');

export const Prefix = codec.type({
    type: codec.literal('prefix'),
    prefix: codec.types.NonEmptyString,
}, 'FilterPrefix');

export const RegExp = codec.intersection([
    codec.type({ type: codec.literal('regexp') }),
    codec.types.RegExp.memo,
], 'FilterRegExp');

export const MIMEType = codec.type({
    type: codec.literal('mimeType'),
    mimeType: mime.Type,
}, 'FilterMIMEType');

export const MIMESubtype = codec.type({
    type: codec.literal('mimeSubtype'),
    mimeSubtype: mime.Subtype,
}, 'FilterMIMESubtype');

export const Options = codec.union([
    Exact,
    Prefix,
    RegExp,
    MIMEType,
    MIMESubtype,
]);

export type Options = codec.TypeOf<typeof Options>;
