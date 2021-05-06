import type * as loader from '../loader';
import type * as mime from '../mime';

import * as item from './item';

type ItemData = loader.LoadedItem;
type ItemState = { state: typeof item.stateLoaded; data: ItemData } | item.UnloadedState;

export class Item extends HTMLElement {
    static readonly namespace = 'mr-item';
    static define (name = Item.namespace) {
        window.customElements.define(name, Item);
    }

    private static defaultState: ItemState = { state: item.stateEmpty };
    
    private _state: ItemState;

    private root: ShadowRoot;
    private media: { image: item.Image; video: item.Video };

    private active: mime.Type;
    private get inactive (): mime.Type { return (this.active === 'image') ? 'video' : 'image' }

    constructor (state = Item.defaultState) {
        super();

        this.root = this.attachShadow({ mode: 'closed' });

        this.active = 'image';
        this.media = {
            image: new item.Image(true),
            video: new item.Video(false),
        };

        this.root.appendChild(this.media.image);
        this.root.appendChild(this.media.video);

        this.state = state;
    }

    private activate (type: mime.Type) {
        if (this.active === type) return;

        this.media[this.active].visible = false;
        this.media[this.inactive].visible = true;
        this.active = type;
    }

    get state () { return this._state }
    set state (s: ItemState) {
        this._state = s;

        if (s.state !== 'loaded') {
            this.media[this.active].state = s;
            return;
        }

        // TODO: This is dumb and crazy
        if (s.data.mime.type === 'image') {
            this.media.image.state = s as item.ImageState;
        } else {
            this.media.video.state = s as item.VideoState;
        }

        this.activate(s.data.mime.type);
    }
}

export class Gallery extends HTMLElement {
    static readonly namespace = 'mr-gallery';
    static define (name = Gallery.namespace) {
        window.customElements.define(name, Gallery);
    }
}
