import * as t from 'io-ts';
import * as types from 'io-ts-types';
import * as either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';

import { Stats, statSync } from 'fs';

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

// ----- Memoized
const memoSym: unique symbol = Symbol('memo');
type Memo<T> = { [memoSym]: T };

// TODO: Have a readonly 'fromMemo' on here as a Type<A & Memo<M>, Memo<M>, Memo<M>>
// similar to the 'fromString' idea on the LiteralUnion
export class Memoized<A extends object, M, O, I> extends t.Type<A & Memo<M>, O, I> {
    readonly _tag: 'MemoizedType' = 'MemoizedType';

    static hasMemo = <T>(u: unknown): u is Memo<T> =>
        (typeof u === 'object' || typeof u === 'function') &&
        u !== null &&
        u[memoSym] != undefined;

    private constructor (
        readonly memo: t.Type<M, O, I>,
        readonly validateMemo: t.Validate<M, A>,
        name = `Memoized<${memo.name}>`,
    ){
        super(
            name,
            (u: unknown): u is A & Memo<M> => Memoized.hasMemo(u) && memo.is(u[memoSym]),
            (i, c) => {
                const eitherMemo = memo.validate(i, c);
                if (either.isLeft(eitherMemo)) return eitherMemo;

                const eitherA = validateMemo(eitherMemo.right, c);
                if (either.isLeft(eitherA)) return eitherA;

                const res = Object.assign(eitherA.right, { [memoSym]: eitherMemo.right });
                return t.success(res);
            },
            a => memo.encode(a[memoSym]),
        );
    }

    withMemo = <N extends M, O, I> (
        codec: t.Type<N, O, I>,
        name?: string,
    ) => new Memoized<A, N, O, I>(codec, this.validateMemo, name);

    static fromValidate = <A extends object, C extends t.Any> (
        codec: C,
        validate: t.Validate<t.TypeOf<C>, A>,
        name?: string,
    ) => new Memoized<A, t.TypeOf<C>, t.OutputOf<C>, t.InputOf<C>>(codec, validate, name);

    static fromEncode = <A extends object, C extends t.Any> (
        codec: C,
        encode: t.Encode<t.TypeOf<C>, A>,
        name?: string,
    ) => Memoized.fromValidate<A, C>(codec, i => t.success(encode(i)), name);

    static fromDecoder = <A extends object, C extends t.Any> (
        codec: C,
        decoder: t.Decoder<t.TypeOf<C>, A>,
        name?: string,
    ) => Memoized.fromValidate<A, C>(codec, decoder.validate, name);

    static fromEncoder = <A extends object, C extends t.Any> (
        codec: C,
        encoder: t.Encoder<t.TypeOf<C>, A>,
        name?: string,
    ) => Memoized.fromEncode<A, C>(codec, encoder.encode, name);

    static fromCodecOutput = <C extends t.Type<any, object, any>> (
        codec: C,
        name?: string,
    ) => {
        const newCodec = new t.Type<t.TypeOf<C>, t.TypeOf<C>, t.InputOf<C>>(
            codec.name, codec.is, codec.validate, t.identity
        );
        
        return Memoized.fromEncode<t.OutputOf<C>, typeof newCodec>(newCodec, codec.encode, name);
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
const _RegExp = Memoized.fromValidate(
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
