import * as loaded from '../../data/loaded';
import * as mime from '../../data/mime';
import * as options from './options';

export function define () {
    Message.define();
    Media.define();
    Element.define();
}

export class Message extends HTMLParagraphElement {
    static readonly namespace = 'mr-info-message';
    static define (name = Message.namespace) {
        window.customElements.define(name, Message, { extends: 'p' });
    }

    constructor (id: string) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Message.namespace);
    }
}

export class Media extends HTMLParagraphElement {
    static readonly namespace = 'mr-info-media';
    static define (name = Media.namespace) {
        window.customElements.define(name, Media, { extends: 'p' });
    }

    private static formatBytes (b: number) {
        if (b === 0) return '0 Bytes';

        const k = 1024;
        const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];

        const i = Math.floor(Math.log(b) / Math.log(k));
        return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    private static formatItemData (item: loaded.Item, mode: options.InfoMediaMode) {
        const sizeStr = Media.formatBytes(item.size);
        const mimeStr = mime.toString(item.mime);
        const nameStr = (mode === 'short')
            ? item.shortname ?? item.name
            : item.name;
        
        return `${nameStr} | ${mimeStr} | ${sizeStr}`;
    }

    private _mode: options.InfoMediaMode;
    private _item: loaded.Item | undefined;

    constructor (id: string, mode: options.InfoMediaMode, item?: loaded.Item) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Media.namespace);

        this._item = item;
        this._mode = mode;
        this.refresh();
    }

    private refresh () {
        this.innerText = (this._item === undefined)
            ? ''
            : Media.formatItemData(this._item, this._mode);
    }

    get mode () { return this._mode }
    set mode (mode: options.InfoMediaMode) {
        this._mode = mode;
        this.refresh();
    }

    get item () { return this.item }
    set item (item: loaded.Item | undefined) {
        this._item = item;
        this.refresh();
    }
}

export class Element extends HTMLElement {
    static readonly namespace = 'mr-info';
    static define (name = Element.namespace) {
        window.customElements.define(name, Element);
    }

    private root: ShadowRoot;
    private curSubinfo: HTMLParagraphElement;

    private message: Message;
    private media: Media;

    constructor (id: string, opts: options.Info) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Element.namespace);

        this.root = this.attachShadow({ mode: 'closed' });
        this.message = new Message('subinfo-message');
        this.media = new Media('subinfo-media', opts.mediaMode);

        this.curSubinfo = this.message;
        this.root.appendChild(this.curSubinfo);
    }

    private setSubinfo (subinfo: HTMLParagraphElement) {
        if (this.curSubinfo.id === subinfo.id) return;
        
        this.root.replaceChild(subinfo, this.curSubinfo);
        this.curSubinfo = subinfo;
    }

    get mediaMode () { return this.media.mode }
    set mediaMode (mediaMode: options.InfoMediaMode) { this.media.mode = mediaMode }

    setEmpty = () => this.setMessage('');

    setMessage (message: string) {
        this.message.innerText = message;
        this.setSubinfo(this.message);
    }

    setMediaItem (item: loaded.Item) {
        this.media.item = item;
        this.setSubinfo(this.media);
    }
}
