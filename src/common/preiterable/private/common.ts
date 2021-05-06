import * as direction from './direction';

// ----- Type definitions
export type Result<T> = IteratorResult<T, direction.Term>;

// ----- Abstract bases
abstract class _Iterable<TGet, TJump> {
    readonly id: symbol;
    constructor (id: string | symbol) { this.id = (typeof id === 'string') ? Symbol(id) : id }

    protected abstract build (): _Iterator<TGet, TJump>;
}

abstract class _Iterator<TGet, TJump> {
    next () { return this.get('next') }
    previous () { return this.get('previous') }

    abstract readonly size: number;
    abstract jump (term: direction.Term): TJump;
    abstract get (direction: direction.Direction): TGet;
}

export { _Iterable as Iterable, _Iterator as Iterator };

// ----- Utility?
export class ArrayIterator<T> extends _Iterator<Result<T>, void> {
    private idx: number;
    
    constructor (private data: T[]) {
        super();
        this.jump('SOD');
    }

    private getIncr (): Result<T> {
        switch (this.idx) {
            case this.data.length - 1:
                this.idx++;
            case this.data.length:
                return { done: true, value: 'EOD' };
            default:
                return { done: false, value: this.data[++this.idx] };
        }
    }

    private getDecr (): Result<T> {
        switch (this.idx) {
            case 0:
                this.idx--;
            case -1:
                return { done: true, value: 'SOD' };
            default:
                return { done: false, value: this.data[--this.idx] };
        }
    }

    get size () { return this.data.length }
    jump (term: direction.Term) { this.idx = (term === 'SOD') ? -1 : this.data.length }
    get (direction: direction.Direction) { return (direction === 'next') ? this.getIncr() : this.getDecr() }
}

export type LazyLoader<TGet, TJump> = {
    next (): TGet;
    all (): TJump;
};
