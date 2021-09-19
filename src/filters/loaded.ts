import type * as loaded from '../data/loaded';

import * as codec from '../common/codec';
import * as base from './base';
import * as memo from './memo';
import * as mime from '../data/mime';

export type Filter = base.Filter<loaded.Item>;
export const merge = (...filters: Filter[]) => base.merge(...filters);

export const filterMIMEType = (type: mime.Type): Filter => item => item.mime.type != type;
export const filterMIMESubtype = (subtype: mime.Subtype): Filter => item => item.mime.subtype != subtype;

const MIMEType = codec.memoized.fromEncode(
    memo.MIMEType,
    a => filterMIMEType(a.mimeType),
);

const MIMESubtype = codec.memoized.fromEncode(
    memo.MIMESubtype,
    a => filterMIMESubtype(a.mimeSubtype),
);

export const Options = codec.union([
    MIMEType,
    MIMESubtype,
]);

export type Options = codec.TypeOf<typeof Options>;
