import * as t from 'io-ts';
import * as fromstring from '../fromstring';

export interface Input {
    peek (): string | undefined;
    consume (): string | undefined;
};

export type Type<T> = t.Type<T, string[], Input>;
export interface C<T> extends Type<T> {};

export const boolean: Type<boolean> = new t.Type(
    'BooleanFlag',
    t.boolean.is,
    i => {
        const arg = i.peek();
        switch (arg) {
            case 'true':
                i.consume();
                return t.success(true);
            case 'false':
                i.consume();
                return t.success(false);
        }
        return t.success(true);
    },
    a => [ String(a) ],
);

export const string: Type<string> = new t.Type(
    'StringFlag',
    t.string.is,
    (i, c) => {
        const arg = i.consume();
        return (arg === undefined) ? t.failure(i, c) : t.success(arg);
    },
    a => [ a ],
);

export const singleArg = <T>(c: fromstring.C<T>, name = `${c.name}Flag`): Type<T> => string.pipe(c, name);

export const number = singleArg(fromstring.number, 'NumberFlag');
export const integer = singleArg(fromstring.integer, 'IntegerFlag');
export const filesystemPath = singleArg(fromstring.filesystemPath, 'FilesystemPathFlag');
export const filePath = singleArg(fromstring.filePath, 'FilePathFlag');
export const directoryPath = singleArg(fromstring.directoryPath, 'DirectoryPathFlag');
