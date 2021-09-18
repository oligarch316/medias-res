import * as t from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/Either';

export interface FlagInput {
    peek (): string | undefined;
    consume (): string | undefined;
};

export type Flag<T> = t.Type<T, string[], FlagInput>;

export const booleanFlag: Flag<boolean> = new t.Type(
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

export const stringFlag: Flag<string> = new t.Type(
    'StringFlag',
    t.string.is,
    (i, c) => {
        const arg = i.consume();
        return (arg === undefined) ? t.failure(i, c) : t.success(arg);
    },
    a => [ a ],
);

export const singleArgFlag = <T>(
    c: t.Type<T, string, string>,
    name = `${c.name}Flag`,
): Flag<T> => stringFlag.pipe(c, name);

const numberFromString = new t.Type<number, string, string>(
    'NumberFromString',
    t.number.is,
    (i, c) => {
        const n = Number(i);
        return (isNaN(n) || i.trim() === '') ? t.failure(i, c) : t.success(n);
    },
    String,
);

const integerFromString = new t.Type<t.Int, string, string>(
    'IntegerFromString',
    t.Int.is,
    (i, c) => pipe(
        numberFromString.validate(i, c),
        chain(n => t.Int.is(n) ? t.success(n) : t.failure(i, c)),
    ),
    String,
);

export const numberFlag = singleArgFlag(numberFromString, 'NumberFlag');
export const integerFlag = singleArgFlag(integerFromString, 'IntegerFlag');
