import * as pre from './async';

const termStartResult = { done: true, value: 'SOD' };
const termEndResult = { done: true, value: 'EOD' };

async function expectEmpty (actual: pre.Iterable<any>) {
    const iter = actual[pre.Symbol]();

    expect(await iter.get('next')).toStrictEqual(termEndResult);
    expect(await iter.get('next')).toStrictEqual(termEndResult);

    expect(await iter.get('previous')).toStrictEqual(termStartResult);
    expect(await iter.get('previous')).toStrictEqual(termStartResult);
}

async function expectN<T> (expected: Array<T>, actual: pre.Iterable<T>) {
    const n = expected.length;
    const iter = actual[pre.Symbol]();

    // Assert sequential 'next' calls produce expected items
    for (const expectedValue of expected) {
        const actualResult = await iter.get('next');
        const expectedResult = { done: false, value: expectedValue };
        expect(actualResult).toStrictEqual(expectedResult);
    }

    // Assert further 'next' calls repeatedly produce 'done'
    expect(await iter.get('next')).toStrictEqual(termEndResult);
    expect(await iter.get('next')).toStrictEqual(termEndResult);

    // Assert sequential 'previous' calls produce reversed expected items
    for (const expectedValue of expected.slice().reverse()) {
        const actualResult = await iter.get('previous');
        const expectedResult = { done: false, value: expectedValue };
        expect(actualResult).toStrictEqual(expectedResult);
    }

    // Assert further 'previous' calls repeatedly produce 'done'
    expect(await iter.get('previous')).toStrictEqual(termStartResult);
    expect(await iter.get('previous')).toStrictEqual(termStartResult);

    // Jump to end and assert:
    // - 'next' produces done
    // - 'previous' produces tail of expected items
    await iter.jump('EOD');
    expect(await iter.get('next')).toStrictEqual(termEndResult);
    expect(await iter.get('previous')).toStrictEqual({ done: false, value: expected[n - 1] });

    // Jump to start and assert:
    // - 'previous' produces 'done'
    // - 'next' produces head of expected items
    await iter.jump('SOD');
    expect(await iter.get('previous')).toStrictEqual(termStartResult);
    expect(await iter.get('next')).toStrictEqual({ done: false, value: expected[0] });
}

function *genNums (start: number, end: number) {
    for (let cur = start; cur <= end; cur++) yield cur;
}

async function *genAsyncEmpty<T=number> (): AsyncGenerator<T, void, undefined> {};
async function *genAsyncNums (start: number, end: number) { yield* genNums(start, end) }
async function *genAsyncLazyArrays<T> (iterables: AsyncIterable<T>[]) {
    for (const x of iterables) yield new pre.LazyArray(x);
}

describe('array', () => {
    test('[]', async () => {
        const emptyArray: Array<Promise<number>> = [];
        const actual = new pre.Array(emptyArray);
        return expectEmpty(actual);
    });

    test('[1-10]', async () => {
        const expected = Array.from(genNums(1, 10));
        const actual = new pre.Array(Array.from(genNums(1, 10), x => Promise.resolve(x)));        
        return expectN(expected, actual);
    });
});

describe('lazy array', () => {
    test('[]', async () => {
        const actual = new pre.LazyArray(genAsyncEmpty());
        return expectEmpty(actual);
    });

    test('[1-10]', async () => {
        const expected = Array.from(genNums(1, 10));
        const actual = new pre.LazyArray(genAsyncNums(1, 10));
        return expectN(expected, actual);
    });
});

describe('hetero stack', () => {
    test('collate []', async () => {
        const actual = pre.HeteroStack.collate(genAsyncEmpty());
        return expectEmpty(actual);
    });

    test('flatten []', async () => {
        const gen = genAsyncLazyArrays<number>([]);
        const actual = pre.HeteroStack.flatten(new pre.LazyArray(gen));
        return expectEmpty(actual);
    });

    test('collate -> flatten [ 1, 2, [3-4], 5, [6-7], [8-9], 10, [ [11-12], [13-15] ]', async () => {
        const recGen = genAsyncLazyArrays([
            genAsyncNums(11, 12),
            genAsyncNums(13, 15),
        ]);

        const gen = async function* (): AsyncGenerator<number | pre.HeteroRecursable<number>, void, undefined> {
            yield 1;
            yield 2;
            yield new pre.LazyArray(genAsyncNums(3, 4));
            yield 5;
            yield new pre.LazyArray(genAsyncNums(6, 7));
            yield new pre.LazyArray(genAsyncNums(8, 9));
            yield 10;
            yield new pre.LazyArray(recGen);
        }();

        const collated = pre.HeteroStack.collate(gen);
        
        const expected = Array.from(genNums(1, 15));
        const actual = pre.HeteroStack.flatten(collated);
        return expectN(expected, actual);
    });
});

describe('homo stack', () => {
    test('collate []', async () => {
        const actual = pre.HomoStack.collate(genAsyncEmpty());
        return expectEmpty(actual);
    });

    test('flatten []', async () => {
        const gen = genAsyncLazyArrays<number>([]);
        const actual = pre.HomoStack.flatten(new pre.LazyArray(gen));
        return expectEmpty(actual);
    });

    test('flatten [ [1-5] [6-10] [11-15] ]', async () => {
        const gen = genAsyncLazyArrays([
            genAsyncNums(1, 5),
            genAsyncNums(6, 10),
            genAsyncNums(11, 15),
        ]);

        const expected = Array.from(genNums(1, 15));
        const actual = pre.HomoStack.flatten(new pre.LazyArray(gen));
        return expectN(expected, actual);
    });

    test('collate -> flatten [ 1, 2, [3-4], 5, [6-7], [8-9], 10, [ [11-12], [13-15] ]', async () => {
        const recGen = genAsyncLazyArrays([
            genAsyncNums(11, 12),
            genAsyncNums(13, 15),
        ]);

        const gen = async function* (): AsyncGenerator<number | pre.HomoRecursable<number>, void, undefined> {
            yield 1;
            yield 2;
            yield new pre.LazyArray(genAsyncNums(3, 4));
            yield 5;
            yield new pre.LazyArray(genAsyncNums(6, 7));
            yield new pre.LazyArray(genAsyncNums(8, 9));
            yield 10;
            yield new pre.LazyArray(recGen);
        }();

        const collated = pre.HomoStack.collate(gen);

        const expected = Array.from(genNums(1, 15));
        const actual = pre.HomoStack.flatten(collated);
        return expectN(expected, actual);
    });
});
