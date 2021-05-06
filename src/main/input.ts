import minimist from 'minimist';

export class CLI {
    private static parseOpts = {
        boolean: [ 'recurse', 'recurse-fs' ],
        alias: {
            r: 'recurse',
        },
    };

    static load () { return new CLI(process.argv.slice(2)) }

    readonly arguments: string[];
    readonly options: {};

    constructor (argv: string[]) {
        const { _: args , ...opts } = minimist(argv, CLI.parseOpts);

        this.arguments = args;
        this.options = opts;
    }
}
