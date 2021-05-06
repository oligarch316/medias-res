import * as data from '../data';

// TODO: try https://github.com/sindresorhus/got

export async function handle (raw: data.common.HTTPItem): Promise<data.Item | data.Seed> {
    throw new Error('parse http|https not yet implemented');
}
