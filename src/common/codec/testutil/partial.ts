type CompleteOn<T, KS extends keyof T> = T & { [K in KS]-?: T[K] };

const reportMissingKeys = <T, KS extends keyof T>(a: T, keys: KS[]) => {
    const missing = keys.filter(k => a[k] === undefined);
    return new Error(`missing keys ${missing.join(', ')}`);
};

export const assertKeys = <T, KS extends keyof T>(
    a: T,
    ...keys: KS[]
): a is CompleteOn<T, KS> => keys.every(k => a[k] !== undefined);

export function requireKeys<T, KS extends keyof T> (a: T, ...keys: KS[]): asserts a is CompleteOn<T, KS> {
    if (!assertKeys(a, ...keys)) fail(reportMissingKeys(a, keys));
}
