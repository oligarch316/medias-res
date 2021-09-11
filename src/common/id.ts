export type Id = number;
export type Factory = Generator<Id, never, undefined>;

export function* factory (): Factory {
    for (let i = 0; ; i++) yield i;
}

export const toString = (id: Id) => String(id);
export const fromString = (s: string): Id => parseInt(s, 10);

export type Instance = Id;
export type Collection = Id;
export type Iterator = Id;

export const instanceQueryName = 'instanceId';

export const instanceToQueryRecord = (id: Instance) => ({ [instanceQueryName]: toString(id) });
export const instanceFromLocation = (location: Location) => instanceFromQueryString(location.search);
export const instanceFromQueryString = (queryStr: string) => {
    if (queryStr.length < 1) throw new Error('empty query string');
    
    const params = new URLSearchParams(queryStr.substring(1));
    const idStr = params.get(instanceQueryName);

    if (idStr === null) throw new Error(`failed to read query parameter: ${instanceQueryName}`);

    return fromString(idStr);
}
