import * as codec from '../../common/codec';
import * as common from '../../common/filter';
import * as loaded from '../../data/loaded';
import * as mime from '../../data/mime';

export type Function = common.Function<loaded.Item>;
export const merge = (...funcs: Function[]) => common.merge(...funcs);

const buildMIMEType = (type: mime.Type): Function => item => item.mime.type != type;
const buildMIMESubtype = (subtype: mime.Subtype): Function => item => item.mime.subtype != subtype;

export const mimeType = codec.memoized.Type.fromEncode(
    common.fromProps('mimeType', { mimeType: mime.Type }),
    a => buildMIMEType(a.mimeType),
);

export const mimeSubtype = codec.memoized.Type.fromEncode(
    common.fromProps('mimeSubtype', { mimeSubtype: mime.Subtype }),
    a => buildMIMESubtype(a.mimeSubtype),
);

export const Type = codec.union([ mimeType, mimeSubtype ]);
export type Type = codec.TypeOf<typeof Type>;

export type Memo = codec.memoized.MemoOf<Type>;
export type Kind = Memo['kind'];
