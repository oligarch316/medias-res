export const imagePaths = {
    'empty':       'assets/images/empty.svg',
    'error':       'assets/images/error.svg',
    'startOfData': 'assets/images/sod.svg',
    'endOfData':   'assets/images/eod.svg',
    'loading':     'assets/images/loading.svg',
} as const;

export function define () {
    Image.define();
}

export type ImageName = keyof typeof imagePaths;

export class Image extends HTMLImageElement {
    static readonly namespace = 'mr-asset-image';
    static define (name = Image.namespace) {
        window.customElements.define(name, Image, { extends: 'img' });
    }

    constructor (id: string) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Image.namespace);
    }

    show (name: ImageName) { this.src = imagePaths[name] }
}
