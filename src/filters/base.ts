export type Filter<T> = (item: T) => boolean;

export const merge = <T>(...filters: Filter<T>[]): Filter<T> => (item: T) => {
    for (const filter of filters) {
        if (!filter(item)) return false;
    }
    return true;
};
