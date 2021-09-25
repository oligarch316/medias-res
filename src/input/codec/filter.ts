import * as codec from '../../common/codec';
import * as common from '../../common/filter';
import * as classify from '../../main/classify/filter';
import * as parse from '../../render/parse/filter';
import * as load from '../../render/load/filter';

import { either } from 'fp-ts';

// ----- Primitive
export const primitive = codec.mergeable.partial({
    classify: codec.mergeable.array(classify.Type),
    parse: codec.mergeable.array(parse.Type),
    load: codec.mergeable.array(load.Type),
});

export type Primitive = codec.TypeOf<typeof primitive>;

// ----- Compound
// Utility
type PrimitiveTypes = { classify: classify.Type, parse: parse.Type, load: load.Type };
type ValidateInput<V extends codec.Validate<any, any>> = V extends codec.Validate<infer T, any> ? T : never;

function proxyV<A, KS extends keyof Primitive> (vs: { [K in KS]: codec.Validate<A, PrimitiveTypes[K]> }): codec.Validate<A, Primitive>;
function proxyV<A> (vs: { [k: string]: codec.Validate<A, any> }) {
    return (i: A, c: codec.Context) => {
        const res = {}
        for (const [key, val] of Object.entries(vs)) {
            const e = val(i, c);
            if (either.isLeft(e)) return e;
            res[key] = [ e.right ];
        }
        return codec.success(res);
    }
}

function lazyV<V extends codec.Validate<any, Primitive>> (v: V, a: ValidateInput<V>): codec.Validate<any, Primitive> {
    return (_, c: codec.Context) => v(a, c);
}

function mergeVs<A> (...vs: codec.Validate<A, Primitive>[]): codec.Validate<A, Primitive> {
    return (i: A, c: codec.Context) => {
        let res: Primitive = {};
        for (const v of vs) {
            const e = v(i, c);
            if (either.isLeft(e)) return e;
            res = primitive.merge(res, e.right);
        }
        return codec.success(res);
    }
}

// Direct proxies
const proxyExact       = proxyV({ classify: classify.exact.validateMemo, parse: parse.exact.validateMemo });
const proxyPrefix      = proxyV({ classify: classify.prefix.validateMemo, parse: parse.prefix.validateMemo });
const proxySuffix      = proxyV({ classify: classify.suffix.validateMemo, parse: parse.suffix.validateMemo });
const proxyRegExp      = proxyV({ classify: classify.regExp.validateMemo, parse: parse.regExp.validateMemo });
const proxyMimeType    = proxyV({ load: load.mimeType.validateMemo });
const proxyMimeSubtype = proxyV({ load: load.mimeSubtype.validateMemo });

export const exact       = codec.memoized.Type.fromValidate(common.exact, proxyExact);
export const prefix      = codec.memoized.Type.fromValidate(common.prefix, proxyPrefix);
export const suffix      = codec.memoized.Type.fromValidate(common.suffix, proxySuffix);
export const regExp      = codec.memoized.Type.fromValidate(common.regExp, proxyRegExp);
export const mimeType    = codec.memoized.Type.fromValidate(load.mimeType.memo, proxyMimeType);
export const mimeSubtype = codec.memoized.Type.fromValidate(load.mimeSubtype.memo, proxyMimeSubtype);

// Static aliases
export const hidden = codec.memoized.Type.fromValidate(
    common.fromProps('hidden', {}),
    (_, c) => proxyPrefix({ kind: 'prefix', prefix: '.' as codec.NonEmptyString }, c),
);

export const hiddenMacOS = codec.memoized.Type.fromValidate(
    common.fromProps('hiddenMacOS', {}),
    mergeVs(
        lazyV(proxyExact, { kind: 'exact', target: '.DS_Store' as codec.NonEmptyString }),
        lazyV(proxyPrefix, { kind: 'prefix', prefix: '._' as codec.NonEmptyString }),
    ),
);

export const images = codec.memoized.Type.fromValidate(
    common.fromProps('images', {}),
    (_, c) => proxyMimeType({ kind: 'mimeType', mimeType: 'image' }, c),
);

export const videos = codec.memoized.Type.fromValidate(
    common.fromProps('videos', {}),
    (_, c) => proxyMimeType({ kind: 'mimeType', mimeType: 'video' }, c),
);

// Dynamic aliases
export const extension = codec.memoized.Type.fromValidate(
    common.fromProps('extension', { extension: codec.NonEmptyString }),
    (i, c) => proxySuffix({ kind: 'suffix', suffix: `.${i.extension}` as codec.NonEmptyString }, c),
);

// Completed compound type
const singleCompound = codec.union([
    // Direct proxies
    exact, prefix, suffix, regExp, mimeType, mimeSubtype,

    // Static aliases
    hidden, hiddenMacOS, images, videos,

    // Dynamic aliases
    extension,
]);

export const compound = codec.memoized.Type.fromEncode(
    codec.partial({ any: codec.array(singleCompound) }),
    a => (a.any !== undefined) ? a.any.reduce(primitive.merge, {} as Primitive) : {},
);

export type Compound = codec.TypeOf<typeof compound>;

