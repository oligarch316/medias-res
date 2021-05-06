import type * as data from './data';

import * as pre from '../common/preiterable/async';
import * as base from './parse/parser';

export class Parser {
    // TODO: Necessary work for plugin (non-basic) related parsing
    
    constructor () {}

    parse (raw: pre.Iterable<data.common.Item>): data.Seed { return base.parseBasic(raw) }
}
