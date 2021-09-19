import * as t from 'io-ts';
import * as types from 'io-ts-types';
import * as fromstring from './fromstring';
import * as memoized from './memoized';
import { pipe } from 'fp-ts/function';
import { chain, tryCatch } from 'fp-ts/Either';

export * as cli from './cli';
export * as fromstring from './fromstring';
export * as memoized from './memoized';
export * as mergeable from './mergeable';

export * from 'io-ts';
export { NonEmptyString as nonEmptyString } from 'io-ts-types';

export const filesystemPath = t.string.pipe(fromstring.filesystemPath);
export const filePath = t.string.pipe(fromstring.filePath);
export const directoryPath = t.string.pipe(fromstring.directoryPath);

export class LiteralUnion<T extends readonly string[]> extends t.Type<T[number]> {
    readonly _tag: 'LiteralUnionType' = 'LiteralUnionType';

    constructor (
        name: string,
        is: LiteralUnion<T>['is'],
        validate: LiteralUnion<T>['validate'],
        encode: LiteralUnion<T>['encode'],
        readonly fromString: fromstring.C<T[number]>,
    ) { super(name, is, validate, encode) }
}

export interface LiteralUnionC<T extends readonly string[]> extends LiteralUnion<T> {};

export const literalUnion = <T extends readonly string[]>(
    items: T,
    name = `LiteralUnion<${items.join(' | ')}>`,
) => {
    const fromString = fromstring.literalUnion(items, `${name}FromString`);
    return new LiteralUnion(
        name,
        fromString.is,
        (i, c) => pipe(
            t.string.validate(i, c),
            chain(s => fromString.validate(s, c)),
        ),
        fromString.encode,
        fromString,
    );
};

const RegExpMemo = t.intersection([
    t.type({ pattern: types.NonEmptyString }),
    t.partial({ flags: types.NonEmptyString }),
]);

export class RegExpType extends memoized.Type<RegExp, t.TypeOf<typeof RegExpMemo>, t.OutputOf<typeof RegExpMemo>, t.InputOf<typeof RegExpMemo>> {
    readonly fromString: fromstring.C<RegExp>;

    constructor () {
        super('RegExp', RegExpMemo, (i, c) => tryCatch(
            () => new RegExp(i.pattern, i.flags),
            () => [{ value: i, context: c }],
        ));

        this.fromString = new t.Type(
            'RegExpFromString',
            this.is,
            (i, c) => {
                if (!i.startsWith('/')) return t.failure(i, c);

                const endIdx = i.indexOf('/', 1);
                if (endIdx === -1) return t.failure(i, c);

                const data = { pattern: i.slice(1, endIdx), flags: i.slice(endIdx + 1) };
                return this.validate(data, c);
            },
            a => {
                const { pattern, flags } = this.encode(a);
                return `/${pattern}/${flags ?? ''}`;
            },
        );
    }
}

export interface RegExpC extends RegExpType {};

export const regExp: RegExpC = new RegExpType();

