import * as t from 'io-ts';
import * as types from 'io-ts-types';
import * as either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';

import { Stats, statSync } from 'fs';
import * as memoized from './memoized';

// ----- Literal Union
export class LiteralUnion<T extends readonly string[]> extends t.Type<T[number]> {
    readonly _tag: 'LiteralUnionType' = 'LiteralUnionType';

    private static membershipFactory<T extends readonly string[]> (items: T) {
        const o = items.reduce((acc, cur) => {
            acc[cur] = null;
            return acc;
        }, {});

        return (query: string) => o.hasOwnProperty(query);
    }

    static from<T extends readonly string[]> (
        items: T,
        name = `LiteralUnion<${items.join(' | ')}>`,
    ): LiteralUnion<T> {
        const isMember = LiteralUnion.membershipFactory(items);
        const fromString = new t.Type<T[number], string, string>(
            `${name}_FromString`,
            (u: unknown): u is T[number] => t.string.is(u) && isMember(u),
            (i, c) => isMember(i) ? t.success(i): t.failure(i, c),
            t.identity,
        );
        return new LiteralUnion(name, fromString);
    }

    private constructor (
        name: string,
        readonly fromString: t.Type<T[number], string, string>,
    ) {
        super(
            name,
            fromString.is,
            (i, c) => pipe(
                t.string.validate(i, c),
                chain(s => fromString.validate(s, c)),
            ),
            t.identity,
        );
    }
}

// ----- Noop string
export const StringFromString = new t.Type<string, string, string>(
    'StringFromString',
    t.string.is,
    t.success,
    t.identity,
);

// ----- Non-empty string
export { NonEmptyString } from 'io-ts-types';

// ----- File system
interface FilesystemPathBrand { readonly FilesystemPath: unique symbol };
interface FilePathBrand { readonly FilePath: unique symbol };
interface DirectoryPathBrand { readonly DirectoryPath: unique symbol };

const statTest = <B>(test: (stats: Stats) => boolean) => (s: string): s is t.Branded<string, B> => {
    try {
        const stats = statSync(s);
        return test(stats);
    } catch (e) {
        return false;
    }
}

const isFilesystemPath = statTest<FilesystemPathBrand>(_ => true);
const isFilePath = statTest<FilePathBrand>(stats => stats.isFile());
const isDirectoryPath = statTest<DirectoryPathBrand>(stats => stats.isDirectory());

export const FilesystemPathFromString = t.brand(
    StringFromString,
    (s): s is t.Branded<string, FilesystemPathBrand> => isFilesystemPath(s),
    'FilesystemPath',
);

export const FilePathFromString = t.brand(
    StringFromString,
    (s): s is t.Branded<string, FilePathBrand> => isFilePath(s),
    'FilePath',
);

export const DirectoryPathFromString = t.brand(
    StringFromString,
    (s): s is t.Branded<string, DirectoryPathBrand> => isDirectoryPath(s),
    'DirectoryPath',
);

export const FilesystemPath = t.string.pipe(FilesystemPathFromString);
export const FilePath = t.string.pipe(FilePathFromString);
export const DirectoryPath = t.string.pipe(DirectoryPathFromString);

export type FilesystemPath = t.TypeOf<typeof FilesystemPath>;
export type FilePath = t.TypeOf<typeof FilePath>;
export type DirectoryPath = t.TypeOf<typeof DirectoryPath>;

// ----- RegExp
const _RegExp = memoized.fromValidate(
    t.intersection([
        t.type({ pattern: types.NonEmptyString }),
        t.partial({ flags: types.NonEmptyString }),
    ]),
    (i, c) => either.tryCatch(
        () => new RegExp(i.pattern, i.flags),
        () => [{ value: i, context: c }],
    ),
    'RegExp',
);

type _RegExp = t.TypeOf<typeof _RegExp>;

export { _RegExp as RegExp };
