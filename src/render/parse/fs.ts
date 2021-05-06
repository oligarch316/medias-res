import type * as data from '../data';

import * as pre from '../../common/preiterable/async';
import * as mime from '../mime';
import { promises as fsp, Dirent } from 'fs';
import { basename, join } from 'path';

export async function handle (raw: data.common.FSItem): Promise<data.Item | data.Seed> {
    switch (raw.type) {
        case 'file':
            return new File(raw.urlString);
        case 'directory':
            return new Directory(raw.urlString);
    }
}

class File implements data.Item {
    private static IdPrefix = 'FS_File_';

    constructor (private urlString: string) {}

    get id () { return Symbol.for(`${File.IdPrefix}${this.urlString}`) }
    get name () { return this.urlString }
    get shortName () { return basename(this.urlString) }

    async data (): Promise<data.ItemData> {
        const dataBuf = await fsp.readFile(new URL(this.urlString));
        const dataMime = mime.fromExt(this.urlString) ?? mime.fromData(dataBuf);

        if (dataMime === undefined) throw new Error(`failed to determine data mime type: ${this.name}`);

        return { buffer: dataBuf, mime: dataMime };
    }
}

class Directory extends pre.IterableBase<data.Item | data.Seed> implements data.Seed {
    private static IdPrefix = 'FS_Directory_';

    private static entryType (entry: Dirent): data.common.FSItem['type'] | undefined {
        if (entry.isFile()) return 'file';
        if (entry.isDirectory()) return 'directory';
        return undefined;
    }

    constructor (private urlString: string) { super(Symbol.for(`${Directory.IdPrefix}${urlString}`)) }

    private async *genData (): AsyncGenerator<data.Item | data.Seed, void, undefined> {
        const entries = await fsp.readdir(new URL(this.urlString), { withFileTypes: true });
        for (const entry of entries) {
            const typ = Directory.entryType(entry);
            if (typ !== undefined) {
                yield handle({
                    protocol: 'fs',
                    type: typ,
                    urlString: join(this.urlString, encodeURI(entry.name)),
                });
            }
        }
    }

    protected build() {
        return pre.HeteroStack.collate(this.genData())[pre.Symbol]();
    }
}
