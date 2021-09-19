import * as t from 'io-ts';
import * as mergeable from './mergeable';

describe('basic', () => {
    test('booleanAnd', () => {
        expect(mergeable.booleanAnd.merge(true, true)).toBe(true);
        expect(mergeable.booleanAnd.merge(true, false)).toBe(false);
        expect(mergeable.booleanAnd.merge(false, true)).toBe(false);
        expect(mergeable.booleanAnd.merge(false, false)).toBe(false);
    });

    test('booleanOr', () => {
        expect(mergeable.booleanOr.merge(true, true)).toBe(true);
        expect(mergeable.booleanOr.merge(true, false)).toBe(true);
        expect(mergeable.booleanOr.merge(false, true)).toBe(true);
        expect(mergeable.booleanOr.merge(false, false)).toBe(false);
    });

    test('array', () => {
        const StringArray = mergeable.array(t.string);
        
        const empty = [];
        const abc = [ 'a', 'b', 'c' ];
        const def = [ 'd', 'e', 'f' ];

        expect(StringArray.merge(empty, empty)).toEqual([]);
        expect(StringArray.merge(abc, empty)).toEqual([ 'a', 'b', 'c' ]);
        expect(StringArray.merge(empty, def)).toEqual([ 'd', 'e', 'f' ]);
        expect(StringArray.merge(abc, def)).toEqual([ 'a', 'b', 'c', 'd', 'e', 'f' ]);
    });

    test('partial', () => {
        const TestCodec = mergeable.partial({ a: t.boolean });

        const empty = {};
        const aTrue = { a: true };
        const aFalse = { a: false };

        expect(TestCodec.merge(empty, empty)).toEqual({});
        expect(TestCodec.merge(aTrue, empty)).toEqual({ a: true });
        expect(TestCodec.merge(empty, aTrue)).toEqual({ a: true });
        expect(TestCodec.merge(aTrue, aFalse)).toEqual({ a: false });
        expect(TestCodec.merge(aFalse, aTrue)).toEqual({ a: true });
    });

    test('type', () => {
        const TestCodec = mergeable.type({ a: t.boolean });

        const aTrue = { a: true };
        const aFalse = { a: false };

        expect(TestCodec.merge(aTrue, aFalse)).toEqual({ a: false });
        expect(TestCodec.merge(aFalse, aTrue)).toEqual({ a: true });
    });

    test('union', () => {
        const StringOrNumber = mergeable.union([ t.string, t.number ]);

        const oneStr = 'one';
        const oneNum = 1;
        
        const twoStr = 'two';
        const twoNum = 2;

        expect(StringOrNumber.merge(oneStr, oneNum)).toEqual(1);
        expect(StringOrNumber.merge(oneNum, oneStr)).toEqual('one');
        expect(StringOrNumber.merge(oneStr, twoStr)).toEqual('two');
        expect(StringOrNumber.merge(oneNum, twoNum)).toEqual(2);
    });

    test.todo('intersection');
});

describe('basic nested', () => {
    const pArray = t.array(t.string);           // Primitive array
    const mArray = mergeable.array(t.string);   // Mergeable array

    test('partial contains array', () => {
        const TestCodec = mergeable.partial({ a: pArray, b: mArray });

        const merged = TestCodec.merge(
            { a: [ 'elem1' ], b: [ 'elem1' ] },
            { a: [ 'elem2' ], b: [ 'elem2' ] },
        );

        expect(merged).toEqual({
            a: [ 'elem2' ],
            b: [ 'elem1', 'elem2' ],
        });
    });

    test('type contains array', () => {
        const TestCodec = mergeable.type({ a: pArray, b: mArray });

        const merged = TestCodec.merge(
            { a: [ 'elem1' ], b: [ 'elem1' ] },
            { a: [ 'elem2' ], b: [ 'elem2' ] },
        );

        expect(merged).toEqual({
            a: [ 'elem2' ],
            b: [ 'elem1', 'elem2' ],
        });
    });

    test('union included array', () => {
        const TestCodec = mergeable.union([ t.string, mArray ]);

        expect(TestCodec.merge('elem1', 'elem2')).toEqual('elem2');
        expect(TestCodec.merge('elem1', [ 'elem2' ])).toEqual([ 'elem2' ]);
        expect(TestCodec.merge([ 'elem1' ], 'elem2')).toEqual('elem2');
        expect(TestCodec.merge([ 'elem1' ], [ 'elem2' ])).toEqual([ 'elem1', 'elem2' ]);
    });

    test.todo('intersection includes ...');
});

describe('complex nested', () => {
    test('involves type, partial, union, array', () => {
        const mArray = mergeable.array(t.string);
    
        const TestCodec = mergeable.type({
            keyOne: mergeable.partial({
                outer: mergeable.partial({
                    inner: t.boolean,
                }),
            }),
            keyTwo: mergeable.partial({ a: t.boolean, b: t.boolean, c: mArray }),
            keyThree: mergeable.type({ d: t.boolean, e: t.boolean, f: mArray }),
            keyFour: mergeable.union([
                mergeable.type({ yi: mArray, er: mArray }),
                mergeable.type({ san: mArray, si: mArray }),
            ]),
            keyFive: mergeable.union([
                mergeable.type({ liu: mArray, qi: mArray }),
                mergeable.type({ ba: mArray, jiu: mArray }),
            ]),
            // TODO: intersection
        });
    
        const a: t.TypeOf<typeof TestCodec> = {
            keyOne: { outer: { inner: true } },
            keyTwo: { a: true, b: true, c: [ 'elem1' ] },
            keyThree: { d: true, e: true, f: [ 'elem1' ] },
            keyFour: { yi: [ 'elem1' ], er: [ 'elem1' ] },
            keyFive: { liu: [ 'elem1' ], qi: [ 'elem1' ] },
        };
    
        const b: t.TypeOf<typeof TestCodec> = {
            keyOne: { },
            keyTwo: { a: false, b: false, c: [ 'elem2' ] },
            keyThree: { d: false, e: false, f: [ 'elem2' ] },
            keyFour: { san: [ 'elem2' ], si: [ 'elem2' ] },
            keyFive: { liu: [ 'elem2' ], qi: [ 'elem2' ] },
        };
    
        expect(TestCodec.merge(a, b)).toEqual({
            keyOne: { outer: { inner: true } },
            keyTwo: { a: false, b: false, c: [ 'elem1', 'elem2' ] },
            keyThree: { d: false, e: false, f: [ 'elem1', 'elem2' ] },
            keyFour: { san: [ 'elem2' ], si: [ 'elem2' ] },
            keyFive: { liu: [ 'elem1', 'elem2' ], qi: [ 'elem1', 'elem2' ] },
        });
    });
});
