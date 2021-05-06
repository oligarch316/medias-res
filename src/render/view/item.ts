// import type * as data from '../data';
import type * as loader from '../loader';
import type * as mime from '../mime';

// ----- Common
const styleShow = 'object-fit: scale-down';
const styleHide = 'display: none';

export const stateLoaded  = 'loaded';

export const stateEmpty   = 'empty';
export const stateError   = 'error';
export const stateSOD     = 'SOD';
export const stateEOD     = 'EOD';
export const stateLoading = 'loading';

const unloadedPaths = {
    [stateEmpty]:   'assets/images/empty.svg',
    [stateError]:   'assets/images/error.svg',
    [stateSOD]:     'assets/images/sod.svg',
    [stateEOD]:     'assets/images/eod.svg',
    [stateLoading]: 'assets/images/loading.svg',
} as const;

export type UnloadedState = {
    state: typeof stateEmpty | typeof stateError | typeof stateSOD | typeof stateEOD | typeof stateLoading;
};


// ----- Image
export type ImageData = loader.LoadedItem & { mime: mime.Image };
export type ImageState = { state: typeof stateLoaded; data: ImageData } | UnloadedState;

export class Image extends HTMLImageElement {
    static readonly namespace = 'mr-image';
    static define (name = Image.namespace) {
        window.customElements.define(name, Image, { extends: 'img' });
    }

    private static defaultState: ImageState = { state: stateEmpty };
    private static defaultVisible = true;

    private _state: ImageState;
    private _visible: boolean;

    constructor (visible = Image.defaultVisible, state = Image.defaultState) {
        super();

        this.setAttribute('class', Image.namespace);
        this.visible = visible;
        this.state = state;
    }

    get state () { return this._state }
    set state (s: ImageState) {
        this.src = (s.state === stateLoaded) ? s.data.objectURL : unloadedPaths[s.state];
        this._state = s;
    }

    get visible () { return this._visible }
    set visible (v: boolean) {
        this.setAttribute('style', (v) ? styleShow : styleHide);
        this._visible = v;
    }
}

// ----- Video
export type VideoData = loader.LoadedItem & { mime: mime.Video };
export type VideoState = { state: typeof stateLoaded, data: VideoData } | UnloadedState;

export class Video extends HTMLVideoElement {
    static readonly namespace = 'mr-video';
    static define (name = Video.namespace) {
        window.customElements.define(name, Video, { extends: 'video' });
    }

    private static defaultState: VideoState = { state: stateEmpty };
    private static defaultVisible = true;

    private _state: VideoState;
    private _visible: boolean;

    constructor (visible = Video.defaultVisible, state = Video.defaultState) {
        super();

        this.setAttribute('class', Video.namespace);
        this.visible = visible;
        this.state = state;
    }

    get state () { return this._state }
    set state (s: VideoState) {
        // TODO: Stuffz
        this._state = s;
    }

    get visible () { return this._visible }
    set visible (v: boolean) {
        this.setAttribute('style', (v) ? styleShow : styleHide);
        this._visible = v;
    }
}
