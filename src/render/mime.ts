import { extname } from 'path';

const types = [
    'image',
    'video',
] as const;

const imageSubtypes = [
    'apng',
    'bmp',
    'gif',
    'jpeg',
    'png',
    'svg+xml',
    'tiff',
    'webp',
    'x-icon',
] as const;

const videoSubtypes = [
    'mpeg4',
    'webm',
    // TODO: Check for more
] as const;

type ImageSubtype = typeof imageSubtypes[number];
type VideoSubtype = typeof videoSubtypes[number];

export type Type = typeof types[number];
export type Image = { type: 'image'; subtype: ImageSubtype };
export type Video = { type: 'video', subtype: VideoSubtype };
export type Data = Image | Video;

export function toString (data: Data) { return `${data.type}/${data.subtype}` }

const imageExtensions = new Map<string, ImageSubtype>([
    [ 'apng' , 'apng' ],
    [ 'bmp' , 'bmp' ],
    [ 'gif' , 'gif' ],
    [ 'jpeg' , 'jpeg' ],
    [ 'jpg' , 'jpeg' ],
    [ 'png' , 'png' ],
    [ 'svg' , 'svg+xml' ],
    [ 'tiff' , 'tiff' ],
    [ 'webp' , 'webp' ],
    [ 'ico' , 'x-icon' ],
]);

const videoExtensions = new Map<string, VideoSubtype>([
    [ 'mp4', 'mpeg4' ],
    [ 'webm', 'webm' ],
]);

export function fromExt (path: string): Data | undefined {
    let ext = extname(path).toLowerCase();
    if (ext.startsWith('.')) ext = ext.substr(1);

    const vidSubtype = videoExtensions.get(ext);
    if (vidSubtype !== undefined) return { type: 'video', subtype: vidSubtype };

    const imgSubtype = imageExtensions.get(ext);
    if (imgSubtype !== undefined) return { type: 'image', subtype: imgSubtype };

    return undefined;
}

export function fromData (data: Buffer): Data | undefined {
    // TODO
    return undefined;
}
