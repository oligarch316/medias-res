export type Id = number;
export type Factory = Generator<Id, never, undefined>;

export function* factory (): Factory {
    for (let i = 0; ; i++) yield i;
}

export const toString = (id: Id) => String(id);
export const fromString = (s: string): Id => parseInt(s, 10);
