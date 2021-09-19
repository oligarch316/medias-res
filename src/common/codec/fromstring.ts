import * as t from 'io-ts';
import * as types from 'io-ts-types';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';
import { Stats, statSync } from 'fs';

export interface C<A> extends t.Type<A, string, string> {};

// ----- Basics
export const string = new t.Type<string, string, string>(
    'StringFromString',
    t.string.is,
    t.success,
    t.identity,
);

export const nonEmptyString = new t.Type<types.NonEmptyString, string, string>(
    'NonEmptyStringFromString',
    types.NonEmptyString.is,
    types.NonEmptyString.validate,
    t.identity,
);

export const boolean = new t.Type<boolean, string, string>(
    'BooleanFromString',
    t.boolean.is,
    (i, c) => {
        switch (i) {
            case 'true':
                return t.success(true);
            case 'false':
                return t.success(false);
        }
        return t.failure(i, c);
    },
    String,
);

export const number = new t.Type<number, string, string>(
    'NumberFromString',
    t.number.is,
    (i, c) => {
        const n = Number(i);
        return (isNaN(n) || i.trim() === '') ? t.failure(i, c) : t.success(n);
    },
    String,
);

export const integer = new t.Type<t.Int, string, string>(
    'IntegerFromString',
    t.Int.is,
    (i, c) => pipe(
        number.validate(i, c),
        chain(n => t.Int.is(n) ? t.success(n) : t.failure(i, c)),
    ),
    String,
);

// ----- Filesystem
interface FilesystemPathBrand { readonly FilesystemPath: unique symbol };
interface FilePathBrand { readonly FilePath: unique symbol };
interface DirectoryPathBrand { readonly DirectoryPath: unique symbol };

const fsStatTest = <B>(test: (stats: Stats) => boolean) => (s: string): s is t.Branded<string, B> => {
    try {
        const stats = statSync(s);
        return test(stats);
    } catch (e) {
        return false;
    }
}

export const filesystemPath = t.brand(
    string,
    fsStatTest<FilesystemPathBrand>(_ => true),
    'FilesystemPath',
);

export const filePath = t.brand(
    string,
    fsStatTest<FilePathBrand>(stats => stats.isFile()),
    'FilePath',
);

export const directoryPath = t.brand(
    string,
    fsStatTest<DirectoryPathBrand>(stats => stats.isDirectory()),
    'DirectoryPath',
);

// ----- Literal Union
function literalUnionMembershipFactory (items: readonly string[]) {
    const o = items.reduce((acc, cur) => {
        acc[cur] = null;
        return acc;
    }, {});
    return (query: string) => o.hasOwnProperty(query);
}

export const literalUnion = <T extends readonly string[]>(
    items: T,
    name = `LiteralUnion<${items.join(' | ')}>FromString`,
) => {
    const isMember = literalUnionMembershipFactory(items);
    return new t.Type<T[number], string, string>(
        name,
        (u: unknown): u is T[number] => string.is(u) && isMember(u),
        (i, c) => isMember(i) ? t.success(i) : t.failure(i, c),
        t.identity,
    );
};
