export type FSItem = {
    protocol:  'fs';
    type:      'file' | 'directory';
    urlString: string;
};

export type HTTPItem = {
    protocol:  'http' | 'https';
    urlString: string;
};

export type Item = FSItem | HTTPItem;
