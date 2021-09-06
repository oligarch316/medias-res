import * as codec from '../common/codec';
import * as main from '../main/context';
import * as render from '../render/context';

export const Complete = codec.type({
    main: main.Complete,
    render: render.Complete,
});

export const Incomplete = codec.partial({
    main: main.Incomplete,
    render: render.Incomplete,
});

export type Complete = codec.TypeOf<typeof Complete>;
export type Incomplete = codec.TypeOf<typeof Incomplete>;

export function mergeTODO (base: Complete, ...list: Incomplete[]): Complete;
export function mergeTODO (base: Incomplete, ...list: Incomplete[]): Incomplete;
export function mergeTODO (...list: Incomplete[]) {
    // TODO
    return list[0];
}
