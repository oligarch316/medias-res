export type Term = 'SOD' | 'EOD';
export type Direction = 'next' | 'previous';

export function termsOf (direction: Direction): { start: Term, done: Term } {
    return (direction === 'next')
        ? { start: 'SOD', done: 'EOD' }
        : { start: 'EOD', done: 'SOD' };
}

export function startOf (direction: Direction) { return termsOf(direction).start }
export function endOf (direction: Direction) { return termsOf(direction).done }
