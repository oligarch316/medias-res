import * as codec from '../common/codec';
import * as main from '../main/options';
import * as render from '../render/options';

export const Complete = codec.mergeable.type({
    main: main.Complete,
    render: render.Complete,
});

export const Incomplete = codec.mergeable.partial({
    main: main.Incomplete,
    render: render.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;

export function merge (base: Complete, ...list: Incomplete[]): Complete;
export function merge (base: Incomplete, ...list: Incomplete[]): Incomplete;
export function merge (base: Incomplete, ...list: Incomplete[]) {
    return list.reduce(Incomplete.merge, base);
}
