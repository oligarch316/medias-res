import type * as classified from '../data/classified';

import * as codec from '../common/codec';
import * as base from './base';
import * as memo from './memo';
import { isLeft } from 'fp-ts/Either';
import { basename } from 'path';

export type Filter = base.Filter<classified.Item>;
export const merge = (...filters: Filter[]) => base.merge(...filters);

const filterExact  = (target: string): Filter => item => basename(item.urlString) != target;
const filterPrefix = (prefix: string): Filter => item => basename(item.urlString).startsWith(prefix);
const filterRegExp = (regexp: RegExp): Filter => item => regexp.test(basename(item.urlString));

const Exact = codec.types.Memoized.fromEncode(
    memo.Exact,
    a => filterExact(a.target),
);

const Prefix = codec.types.Memoized.fromEncode(
    memo.Prefix,
    a => filterPrefix(a.prefix),
);

const RegExp = codec.types.Memoized.fromValidate(
    memo.RegExp,
    (i, c) => {
        const e = codec.types.RegExp.validateMemo(i, c);
        return (isLeft(e))
            ? e
            : codec.success(filterRegExp(e.right));
    },
);

export const Options = codec.union([
    Exact,
    Prefix,
    RegExp,
]);

export type Options = codec.TypeOf<typeof Options>;
