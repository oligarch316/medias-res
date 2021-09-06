import type * as classified from '../../../data/classified';
import type * as parsed from '../../../data/parsed';
import type * as handler from '../handler';

import * as pre from '../../../common/preiterable/async';
import * as mime from '../../../data/mime';
import { promises as fsp, Dirent } from 'fs';
import { basename, join } from 'path';

export type Options = {};

export class Handler implements handler.Handler<'fs'> {
    constructor (private opts: Options) {}

    async handle (item: classified.FSItem): Promise<parsed.Item | parsed.Recursable> {
        switch (item.type) {
            case 'file':
                return new File(item.urlString);
            case 'directory':
                return new Directory(item.urlString, x => this.handle(x));
        }
    }
}

class File implements parsed.Item {
    private static IdPrefix = 'FS_File_';

    id: symbol;
    name: string;
    shortname: string;

    constructor (urlString: string) {
        this.id = Symbol.for(`${File.IdPrefix}${urlString}`);
        this.name = urlString;
        this.shortname = basename(urlString);
    }

    async data (): Promise<parsed.ItemData> {
        const dataBuf = await fsp.readFile(new URL(this.name));
        const dataMime = mime.fromExt(this.name) ?? mime.fromData(dataBuf);

        if (dataMime === undefined) throw new Error(`failed to determine data mime type: ${this.name}`);

        return { buffer: dataBuf, mime: dataMime };
    }
}

class Directory extends pre.IterableBase<parsed.Item | parsed.Recursable> implements parsed.Recursable {
    private static IdPrefix = 'FS_Directory_';

    // TODO: Ugly that we're doing "classification" here in the "parser"
    private static entryType (entry: Dirent): classified.FSItem['type'] | undefined {
        if (entry.isFile()) return 'file';
        if (entry.isDirectory()) return 'directory';
        return undefined;
    }

    constructor (
        private urlString: string,
        private recurse: handler.Function<'fs'>,
    ) {
        super(Symbol.for(`${Directory.IdPrefix}${urlString}`));
    }

    private async *gen () {
        const entries = await fsp.readdir(new URL(this.urlString), { withFileTypes: true });
        for (const entry of entries) {
            const typ = Directory.entryType(entry);
            if (typ !== undefined) {
                yield this.recurse({
                    protocol: 'fs',
                    type: typ,
                    urlString: join(this.urlString, encodeURI(entry.name)),
                });
            }

            // TODO: else => Report unknown entry type
        }
    }

    protected build = () => pre.HeteroStack.collate(this.gen())[pre.Symbol]();
}
