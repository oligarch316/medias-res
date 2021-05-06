export type Identifiable = { readonly id: symbol };
export type Sizeable = { readonly size: number };

export class LRUCache<K, V extends Sizeable> {
    // Spiralling in a cache invalidation rat-hole, so
    // for now just hacky insertion order abusing LRU.
    // Revisit cache stuffz when everything else works.

    private dataMap: Map<K, V>;
    private cacheSize: number;

    constructor (private readonly sizeLimit: number) {
        this.dataMap = new Map();
        this.cacheSize = 0;
    }

    private enforceSizeLimit() {
        for (const [key, value] of this.dataMap) {
            this.dataMap.delete(key);
            this.cacheSize -= value.size;
            if (this.cacheSize <= this.sizeLimit) break;
        }
    }

    get size () { return this.cacheSize }

    get (key: K): V | undefined {
        const value = this.dataMap.get(key);
        if (value !== undefined) {
            // Delete and re-insert to update insertion order
            this.dataMap.delete(key);
            this.dataMap.set(key, value);
        }
        return value;
    }

    set (key: K, value: V) {
        const oldValue = this.dataMap.get(key);
        const sizeDelta = (oldValue === undefined) ? value.size : value.size - oldValue.size;

        this.dataMap.set(key, value);
        this.cacheSize += sizeDelta;

        if (this.cacheSize > this.sizeLimit) this.enforceSizeLimit();
    }
}

export type SymbolicLRUCacheFrom<K extends Identifiable, Loader extends (key: K) => any> = SymbolicLRUCache<K, Exclude<ReturnType<Loader>, undefined>, ReturnType<Loader>>;

export abstract class SymbolicLRUCache<K extends Identifiable, V extends Sizeable, LoadV extends V | undefined> {
    static from<K extends Identifiable, V extends Sizeable> (loader: (key: K) => V): new (sizeLimit: number) => SymbolicLRUCache<K, V, V>;
    static from<K extends Identifiable, V extends Sizeable> (loader: (key: K) => V | undefined): new (sizeLimit: number) => SymbolicLRUCache<K, V, V | undefined>;
    static from<K extends Identifiable, V extends Sizeable> (loader: (key: K) => V | undefined) {
        return class Cache extends SymbolicLRUCache<K, V, V | undefined> { protected load = loader };
    }

    private base: LRUCache<symbol, V>;

    constructor (sizeLimit: number) { this.base = new LRUCache(sizeLimit) }

    get size () { return this.base.size }

    get (key: K): LoadV {
        let res = this.base.get(key.id);
        if (res === undefined) {
            res = this.load(key);
            if (res !== undefined) this.base.set(key.id, res);
        }
        return res as LoadV;
    }

    protected abstract load (key: K): LoadV;
}

export class Stack<T extends Sizeable> {
    constructor (private data: T[] = []) {}

    get size () { return this.data.reduce((acc, cur) => acc + cur.size, 0) }
    get top () { return (this.data.length === 0) ? undefined : this.data[0] }

    clear () {
        const len = this.data.length;
        const bottom = (len === 0) ? undefined : this.data[len - 1];
        
        this.data = [];
        return bottom;
    }

    pop () { return this.data.shift() }
    push (item: T) { this.data.unshift(item) }
}
