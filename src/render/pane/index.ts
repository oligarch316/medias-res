import * as pre from '../../common/preiterable/async';
import * as loaded from '../../data/loaded';
import * as assets from './assets';
import * as view from './view';
import * as info from './info';
import * as options from './options';

export * as assets from './assets';

export function define () {
    assets.define();
    view.define();
    info.define();
    Display.define();
}

type DisplayState = {
    iterable: loaded.Iterable;
    iterator: loaded.Iterator;
};

export type DisplayOptions = options.Complete;

export class Display extends HTMLElement {
    static readonly namespace = 'mr-display';
    static define (name = Display.namespace) {
        window.customElements.define(name, Display);
    }

    private static readonly termToData: {
        [K in pre.Term]: {
            assetImageName: assets.ImageName;
            message: string;
        }
    } = {
        'SOD': {
            assetImageName: 'startOfData',
            message: 'start of data',
        },
        'EOD': {
            assetImageName: 'endOfData',
            message: 'end of data',
        },
    };

    private root: ShadowRoot;
    private view: view.Element;
    private info: info.Element;

    private state: DisplayState | undefined;

    constructor (id: string, opts: DisplayOptions, iterable?: loaded.Iterable) {
        super();

        this.setAttribute('id', id);
        this.setAttribute('class', Display.namespace);

        this.root = this.attachShadow({ mode: 'closed' });
        this.view = new view.Element('view', opts.view);
        this.info = new info.Element('info', opts.info);

        this.root.appendChild(this.view);
        this.root.appendChild(this.info);

        this.iterable = iterable;
    }

    private handleTermResult (term: pre.Term) {
        const termData = Display.termToData[term];
        this.view.setAssetImage(termData.assetImageName);
        this.info.setMessage(termData.message);
    }

    private handleExceptionResult (e: any) {
        this.view.setAssetImage('error');
        this.info.setMessage(String(e));
    }

    private handleItemResult (item: loaded.Item) {
        this.view.item = item;
        this.info.setMediaItem(item);
    }

    async move (direction: pre.Direction) {
        if (this.state === undefined) return;

        try {
            const res = await this.state.iterator.get(direction);
            return (res.done)
                ? this.handleTermResult(res.value)
                : this.handleItemResult(res.value);            
        } catch (e) {
            return this.handleExceptionResult(e);
        }
    }

    get iterable () { return this.state?.iterable }
    set iterable (iterable: loaded.Iterable | undefined) {
        if (iterable === undefined) {
            this.view.item = undefined;
            this.info.setEmpty();
            this.state = undefined;
            return;
        }

        this.state = {
            iterable: iterable,
            iterator: iterable[pre.Symbol](),
        };

        this.move('next');
    }
}
