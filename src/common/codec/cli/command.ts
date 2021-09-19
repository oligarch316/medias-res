import * as mergeable from '../mergeable';
import * as t from 'io-ts';
import * as either from 'fp-ts/Either';
import * as flag from './flag';

export type FlagSet = { [key: string]: flag.C<any> };

type FlagName<S extends FlagSet> = Extract<keyof S, string>;

type InputItem<S extends FlagSet> =
    { isFlag: true, value: FlagName<S> } |
    { isFlag: false, value: string };

class Input<S extends FlagSet> implements flag.Input {
    private flagNames: string[];
    private idx: number;

    constructor (flagSet: S, private items: string[]) {
        this.flagNames = Object.keys(flagSet);
        this.idx = 0;
    }

    private isFlagName = (s: string): s is FlagName<S> => this.flagNames.includes(s);

    private cur = () => (this.idx < this.items.length) ? this.items[this.idx] : undefined;

    peek () {
        const item = this.cur();
        return (item === undefined || this.isFlagName(item)) ? undefined : item;
    }

    consume () {
        const item = this.peek();
        if (item !== undefined) this.idx++;
        return item;
    }

    next (): InputItem<S> | undefined {
        const item = this.cur();
        if (item === undefined) return undefined;
        
        this.idx++;
        return (this.isFlagName(item))
            ? { isFlag: true, value: item }
            : { isFlag: false, value: item };
    }
}

export class Type<S extends FlagSet> extends t.Type<
    { args: string[], flags: { [ K in keyof S ]?: t.TypeOf<S[K]> } },
    { args: string[], flags: { [ K in keyof S ]?: t.OutputOf<S[K]> } },
    string[]
> {
    readonly _tag: 'CommandType' = 'CommandType';

    constructor (
        name: string,
        is: Type<S>['is'],
        validate: Type<S>['validate'],
        encode: Type<S>['encode'],
        readonly flagSet: S,
    ) { super(name, is, validate, encode) }
}

export interface C<S extends FlagSet> extends Type<S> {};

export function from<S extends FlagSet> (flagSet: S, name: string): Type<S> {
    return new Type(
        `Command<${name}>`,
        (u: unknown): u is t.TypeOf<Type<S>> => {
            if (!t.UnknownRecord.is(u)) return false;
            for (const [key, val] of Object.entries(u)) {
                const flagCodec = flagSet[key];
                if (flagCodec === undefined || !flagCodec.is(val)) return false;
            }
            return true;
        },
        (i, c) => {
            const cmdInput = new Input(flagSet, i);
            const res: t.TypeOf<Type<S>> = { args: [], flags: {} };

            for (let item = cmdInput.next(); item !== undefined; item = cmdInput.next()) {
                if (!item.isFlag) {
                    res.args.push(item.value);
                    continue;
                }

                const flagCodec = flagSet[item.value];
                const eitherVal = flagCodec.validate(cmdInput, c);

                if (either.isLeft(eitherVal)) return eitherVal; // TODO: Better error info

                const existingVal = res.flags[item.value];
                const shouldMerge = existingVal !== undefined && mergeable.isMergeableC(flagCodec);

                res.flags[item.value] = (shouldMerge)
                    ? flagCodec.merge(existingVal, eitherVal.right)
                    : eitherVal.right;
            }

            return t.success(res);
        },
        a => {
            const res: t.OutputOf<Type<S>> = { args: a.args, flags: {} };
            for (const [key, val] of Object.entries(a.flags)) {
                res.flags[key as keyof S] = flagSet[key].encode(val);
            }
            return res;
        },
        flagSet,
    );
}
