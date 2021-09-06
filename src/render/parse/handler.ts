import * as classified from '../../data/classified';
import * as parsed from '../../data/parsed';

export type Function<P extends classified.Protocol> = 
    (item: classified.ItemFor<P>) => Promise<parsed.Item | parsed.Recursable>;

export interface Handler<P extends classified.Protocol> {
    handle: Function<P>;
};
