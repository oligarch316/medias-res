import * as codec from '../codec';

export interface Input {
    peek (): string | undefined;
    consume (): string | undefined;
};

export type Type<T> = codec.Type<T, string[], Input>;
export interface C<T> extends Type<T> {};

export const boolean: Type<boolean> = new codec.Type(
    'BooleanFlag',
    codec.boolean.is,
    i => {
        const arg = i.peek();
        switch (arg) {
            case 'true':
                i.consume();
                return codec.success(true);
            case 'false':
                i.consume();
                return codec.success(false);
        }
        return codec.success(true);
    },
    a => [ String(a) ],
);

export const string: Type<string> = new codec.Type(
    'StringFlag',
    codec.string.is,
    (i, c) => {
        const arg = i.consume();
        return (arg === undefined) ? codec.failure(i, c) : codec.success(arg);
    },
    a => [ a ],
);

export const singleArg = <T>(c: codec.fromstring.C<T>, name = `${c.name}Flag`): Type<T> => string.pipe(c, name);

export const number = singleArg(codec.fromstring.number, 'NumberFlag');
export const integer = singleArg(codec.fromstring.integer, 'IntegerFlag');
export const filesystemPath = singleArg(codec.fromstring.filesystemPath, 'FilesystemPathFlag');
export const filePath = singleArg(codec.fromstring.filePath, 'FilePathFlag');
export const directoryPath = singleArg(codec.fromstring.directoryPath, 'DirectoryPathFlag');
