import type * as classified from '../data/classified';

import * as codec from '../common/codec';
import * as base from './base';
import * as memo from './memo';
import { basename } from 'path';

import { pipe } from 'fp-ts/lib/function';
import { chain } from 'fp-ts/Either';

export type Filter = base.Filter<classified.Item>;
export const merge = (...filters: Filter[]) => base.merge(...filters);

const filterExact  = (target: string): Filter => item => basename(item.urlString) != target;
const filterPrefix = (prefix: string): Filter => item => basename(item.urlString).startsWith(prefix);
const filterRegExp = (regexp: RegExp): Filter => item => regexp.test(basename(item.urlString));

const Exact = codec.memoized.fromEncode(
    memo.Exact,
    a => filterExact(a.target),
);

const Prefix = codec.memoized.fromEncode(
    memo.Prefix,
    a => filterPrefix(a.prefix),
);

const RegExp = codec.memoized.fromValidate(
    memo.RegExp,
    (i, c) => pipe(
        codec.regExp.validateMemo(i, c),
        chain(r => codec.success(filterRegExp(r))),
    ),
);

export const Options = codec.union([
    Exact,
    Prefix,
    RegExp,
]);

export type Options = codec.TypeOf<typeof Options>;
