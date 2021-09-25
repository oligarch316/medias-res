import * as t from 'io-ts';

export type Function<T> = (a: T, b: T) => T;

export const reversePriority = <T>(f: Function<T>): Function<T> => (a, b) => f(b, a);

export class Type<A, O, I> extends t.Type<A, O, I> {
    readonly _tag: 'MergeableType' = 'MergeableType';

    constructor (
        name: string,
        is: Type<A, O, I>['is'],
        validate: Type<A, O, I>['validate'],
        encode: Type<A, O, I>['encode'],
        readonly merge: Function<A>,
    ) { super(name, is, validate, encode) }

    static from = <C extends t.Any> (
        codec: C,
        merge: Function<t.TypeOf<C>>,
        name = `Mergeable<${codec.name}>`,
    ) => new Type<t.TypeOf<C>, t.OutputOf<C>, t.InputOf<C>>(name, codec.is, codec.validate, codec.encode, merge);
}

export interface C<A, O, I> extends Type<A, O, I> {};

export const isMergeableC = <A, O, I> (codec: t.Type<A, O, I>): codec is C<A, O, I> => (codec as any)._tag === 'MergeableType';

type MergeOfProps<P extends t.AnyProps> = { [K in keyof P]: Function<t.TypeOf<P[K]>> }

const mergeReplace = <T>(_: T, b: T) => b;

function propsMergeFuncs<P extends t.AnyProps> (props: P): MergeOfProps<P> {
    return Object.entries(props).reduce((acc, [key, val]) => {
        acc[key] = isMergeableC(val) ? val.merge : mergeReplace;
        return acc;
    }, {} as any);
}

export const booleanAnd = Type.from(t.boolean, (a, b) => a && b);
export const booleanOr = Type.from(t.boolean, (a, b) => a || b);

export const array = <C extends t.Mixed>(item: C, name?: string) => Type.from(
    t.array(item, name),
    (a, b) => a.concat(b),
);

export const partial = <P extends t.Props>(props: P, name?: string) => {
    const propKeys: (keyof P)[] = Object.keys(props);
    const mergeFuncs = propsMergeFuncs(props);

    return Type.from(
        t.partial(props, name),
        (a, b) => propKeys.reduce((acc, cur) => {
            acc[cur] =
                (b[cur] === undefined) ? a[cur] :
                (a[cur] === undefined) ? b[cur] :
                mergeFuncs[cur](a[cur], b[cur]);
            return acc;
        }, {} as t.TypeOfPartialProps<P>),
    );
};

export const type = <P extends t.Props>(props: P, name?: string) => {
    const propKeys: (keyof P)[] = Object.keys(props);
    const mergeFuncs = propsMergeFuncs(props);

    return Type.from(
        t.type(props, name),
        (a, b) => propKeys.reduce((acc, cur) => {
            acc[cur] = mergeFuncs[cur](a[cur], b[cur]);
            return acc;
        }, {} as t.TypeOfProps<P>),
    );
};

export const union = <CS extends [ t.Mixed, t.Mixed, ...Array<t.Mixed> ]>(codecs: CS, name?: string) => {
    const codecFor = (x: t.TypeOf<CS[number]>) => codecs.find(c => c.is(x)) as CS[number];

    return Type.from(
        t.union(codecs, name),
        (a, b) => {
            const aCodec = codecFor(a);
            return (aCodec.is(b) && isMergeableC(aCodec))
                ? aCodec.merge(a, b)
                : b;
        },
    );
};

// TODO: intersection
// > Proxying the overloaded arguments is proving annoying
