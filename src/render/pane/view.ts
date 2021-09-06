import * as loaded from '../../data/loaded';
import * as options from './options';
import * as assets from './assets';

export function define () {
    Image.define();
    Video.define();
    Element.define();
}

export class Image extends HTMLImageElement {
    static readonly namespace = 'mr-view-image';
    static define (name = Image.namespace) {
        window.customElements.define(name, Image, { extends: 'img' });
    }

    private static modeToStyle: { [K in options.ViewImageMode]: string } = {
        fixed: 'height: 100%; width: 100%; object-fit: contain',
        panned: 'min-height: 100%; min-width: 100%; object-fit: contain',
    };

    private _mode: options.ViewImageMode;

    constructor (id: string, mode: options.ViewImageMode) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Image.namespace);

        this.mode = mode;
    }

    get mode () { return this._mode }
    set mode (mode: options.ViewImageMode) {
        this._mode = mode;
        this.setAttribute('style', Image.modeToStyle[mode]);
    }
}

export class Video extends HTMLVideoElement {
    static readonly namespace = 'mr-view-video';
    static define (name = Video.namespace) {
        window.customElements.define(name, Video, { extends: 'video' });
    }

    constructor (id: string) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Video.namespace);
    }
}

export class Element extends HTMLElement {
    static readonly namespace = 'mr-view';
    static define (name = Element.namespace) {
        window.customElements.define(name, Element);
    }

    private root: ShadowRoot;
    private curSubview: HTMLElement;

    private assetImage: assets.Image;
    private image: Image;
    private video: Video;

    private _item: loaded.Item | undefined;

    constructor (id: string, opts: options.View, item?: loaded.Item) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Element.namespace);

        this.root = this.attachShadow({ mode: 'closed' }); 
        this.assetImage = new assets.Image('subview-assetImage');
        this.image = new Image('subview-image', opts.imageMode);
        this.video = new Video('subview-video');
        
        this.curSubview = this.assetImage;
        this.root.appendChild(this.curSubview);
        
        this.item = item;
    }

    private setSubview (subview: HTMLElement) {
        if (this.curSubview.id === subview.id) return;

        this.root.replaceChild(subview, this.curSubview);
        this.curSubview = subview;
    }

    private subviewForItem (item: loaded.Item) {
        const res = (item.mime.type === 'image') ? this.image : this.video;
        res.src = item.objectURL;
        return res;
    }

    get imageMode () { return this.image.mode }
    set imageMode (imageMode: options.ViewImageMode) { this.image.mode = imageMode }

    get item () { return this._item }
    set item (item: loaded.Item | undefined) {
        if (item === undefined) {
            this.setAssetImage('empty');
            return;
        }

        this.setSubview(this.subviewForItem(item));
        this._item = item;
    }

    setAssetImage (name: assets.ImageName) {
        this.assetImage.show(name);
        this.setSubview(this.assetImage);
        this._item = undefined;
    }
}
