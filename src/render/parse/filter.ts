import * as codec from '../../common/codec';
import * as common from '../../common/filter';
import * as parsed from '../../data/parsed';
import { basename } from 'path';

import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';

export type Function = common.Function<parsed.Item>;
export const merge = (...funcs: Function[]) => common.merge(...funcs);

const buildExact = (target: string): Function => item => basename(item.name) != target;
const buildPrefix = (prefix: string): Function => item => basename(item.name).startsWith(prefix);
const buildSuffix = (suffix: string): Function => item => basename(item.name).endsWith(suffix);
const buildRegExp = (regExp: RegExp): Function => item => regExp.test(basename(item.name));

export const exact = codec.memoized.Type.fromEncode(common.exact, a => buildExact(a.target));
export const prefix = codec.memoized.Type.fromEncode(common.prefix, a => buildPrefix(a.prefix));
export const suffix = codec.memoized.Type.fromEncode(common.suffix, a => buildSuffix(a.suffix));
export const regExp = codec.memoized.Type.fromValidate(common.regExp, (i, c) => pipe(
    codec.regExp.validateMemo(i, c),
    chain(r => codec.success(buildRegExp(r)))
));

export const Type = codec.union([ exact, prefix, suffix, regExp ]);
export type Type = codec.TypeOf<typeof Type>;

export type Memo = codec.memoized.MemoOf<Type>;
export type Kind = Memo['kind'];
