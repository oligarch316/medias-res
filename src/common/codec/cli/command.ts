import * as t from 'io-ts';
import * as either from 'fp-ts/Either';
import * as flags from './flags';

export type FlagSet = { [key: string]: flags.Flag<any> };

type FlagName<S extends FlagSet> = Extract<keyof S, string>;

export class Command<S extends FlagSet> extends t.Type<
    { args: string[], flags: { [ K in keyof S ]?: t.TypeOf<S[K]> } },
    { args: string[], flags: { [ K in keyof S ]?: t.OutputOf<S[K]> } },
    string[]
> {
    readonly _tag: 'CommandType' = 'CommandType';

    constructor (
        name: string,
        is: Command<S>['is'],
        validate: Command<S>['validate'],
        encode: Command<S>['encode'],
        readonly flagSet: S,
    ) { super(name, is, validate, encode) }
}

type CommandInputItem<S extends FlagSet> =
    { isFlag: true, value: FlagName<S> } |
    { isFlag: false, value: string };

class CommandInput<S extends FlagSet> implements flags.FlagInput {
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

    next (): CommandInputItem<S> | undefined {
        const item = this.cur();
        if (item === undefined) return undefined;
        
        this.idx++;
        return (this.isFlagName(item))
            ? { isFlag: true, value: item }
            : { isFlag: false, value: item };
    }
}

export function command<S extends FlagSet> (flagSet: S, name: string): Command<S> {
    return new Command(
        `Command<${name}>`,
        (u: unknown): u is t.TypeOf<Command<S>> => {
            if (!t.UnknownRecord.is(u)) return false;
            for (const [key, val] of Object.entries(u)) {
                const flagCodec = flagSet[key];
                if (flagCodec === undefined || !flagCodec.is(val)) return false;
            }
            return true;
        },
        (i, c) => {
            const cmdInput = new CommandInput(flagSet, i);
            const res: t.TypeOf<Command<S>> = { args: [], flags: {} };

            for (let item = cmdInput.next(); item !== undefined; item = cmdInput.next()) {
                if (!item.isFlag) {
                    res.args.push(item.value);
                    continue
                }

                const e = flagSet[item.value].validate(cmdInput, c);
                if (either.isLeft(e)) return e; // TODO: Better error info

                res.flags[item.value] = e.right;
            }

            return t.success(res);
        },
        a => {
            const res: t.OutputOf<Command<S>> = { args: a.args, flags: {} };
            for (const [key, val] of Object.entries(a.flags)) {
                res.flags[key as keyof S] = flagSet[key].encode(val);
            }
            return res;
        },
        flagSet,
    );
}
