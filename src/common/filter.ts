import * as codec from './codec';

export type Function<T> = (item: T) => boolean;
export const merge = <T>(...funcs: Function<T>[]): Function<T> => item => funcs.every(func => func(item));

const kindProps = <K extends string>(kind: K) => ({ kind: codec.literal(kind) });
const kindName = (kind: string) => `${kind[0].toUpperCase() + kind.slice(1)}Filter`;

export const fromCodec = <K extends string, C extends codec.Mixed>(kind: K, c: C) => {
    const kindType = codec.type(kindProps(kind));
    const name = kindName(kind);
    return codec.intersection([ c, kindType ], name);
};

export const fromProps = <K extends string, P extends codec.Props>(kind: K, props: P) => {
    const propsWithKind = { ...kindProps(kind), ...props };
    const name = kindName(kind);
    return codec.type(propsWithKind, name);
};

export const exact  = fromProps('exact', { target: codec.NonEmptyString });
export const prefix = fromProps('prefix', { prefix: codec.NonEmptyString });
export const suffix = fromProps('suffix', { suffix: codec.NonEmptyString });
export const regExp = fromCodec('regExp', codec.regExp.memo);
