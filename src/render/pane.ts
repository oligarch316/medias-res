import type * as loader from './loader';

import * as pre from '../common/preiterable/async';
import * as itemView from './view/item';
import * as displayView from './view/display';

export function defineViews () {
    itemView.Image.define();
    itemView.Video.define();

    displayView.Item.define();
    displayView.Gallery.define();
}

export function defineAll () {
    defineViews();

    Display.define();
    Select.define();
}

type State = { iterId: symbol, iter: pre.Iterator<loader.LoadedItem> };

export class Display extends HTMLElement {
    static readonly namespace = 'mr-display';
    static define (name = Display.namespace) {
        window.customElements.define(name, Display);
    }

    private root: ShadowRoot;
    private itemView: displayView.Item;
    private galleryView: displayView.Gallery;

    private state: State | undefined;

    constructor (iterable?: pre.Iterable<loader.LoadedItem>) {
        super();

        this.root = this.attachShadow({ mode: 'closed' });
        this.itemView = new displayView.Item();
        this.galleryView = new displayView.Gallery();

        this.root.appendChild(this.itemView);
        this.root.appendChild(this.galleryView);

        this.update(iterable);
    }

    get iterableId () { return this.state?.iterId }

    async update (iterable?: pre.Iterable<loader.LoadedItem>) {
        if (iterable === undefined) {
            this.state = undefined;
            this.itemView.state = { state: 'empty' };
            // TODO: this.galleryView.state = ...
            return;
        }

        this.state = { iterId: iterable.id, iter: iterable[pre.Symbol]() };
        return this.move('next');
    }

    async move (direction: pre.Direction) {
        if (this.state === undefined) return;

        const res = await this.state.iter.get(direction);

        if (res.done) {
            this.itemView.state = { state: res.value };
            // TODO: this.galleryView.state = ...
            return;
        }

        this.itemView.state = { state: 'loaded', data: res.value };
        // TODO: this.galleryView.state = ...
    }
}

export class Select extends HTMLElement {
    static readonly namespace = 'mr-select';
    static define (name = Select.namespace) {
        window.customElements.define(name, Select);
    }

    // TODO

    private ids: Set<symbol>;

    constructor (...ids: symbol[]) {
        super();
        this.ids = new Set(ids);
    }

    add (...ids: symbol[]) { for (const id of ids) this.ids.add(id) }
    delete (...ids: symbol[]) { for (const id of ids) this.ids.delete(id) }
    clear () { this.ids.clear() }
}
