import * as filter from './filter';

const reportUnexpectedAccept = (item: any) => new Error('unexpected filter accept: TODO');
const reportUnexpectedReject = (item: any) => new Error('unexpected filter reject: TODO');

export const assumeAccept = <T>(f: filter.Function<T>, item: T) => { if (!f(item)) fail(reportUnexpectedReject(item)) };
export const assumeReject = <T>(f: filter.Function<T>, item: T) => { if (f(item)) fail(reportUnexpectedAccept(item)) };
