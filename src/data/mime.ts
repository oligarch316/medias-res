import * as codec from '../common/codec';
import { extname } from 'path';

export const types = [
    'image',
    'video',
] as const;

export const Type = codec.types.LiteralUnion.from(types, 'MIMEType');
export type Type = codec.TypeOf<typeof Type>;

export const imageSubtypes = [
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

export const ImageSubtype = codec.types.LiteralUnion.from(imageSubtypes, 'MIMEImageSubtype');
export type ImageSubtype = codec.TypeOf<typeof ImageSubtype>;

export const videoSubtypes = [
    'mpeg4',
    'webm',
    // TODO: Check for more
] as const;

export const VideoSubtype = codec.types.LiteralUnion.from(videoSubtypes, 'MIMEVideoSubtype');
export type VideoSubtype = codec.TypeOf<typeof VideoSubtype>;

export const subtypes = [
    ...imageSubtypes,
    ...videoSubtypes,
] as const;

export const Subtype = codec.types.LiteralUnion.from(subtypes, 'MIMESubtype');
export type Subtype = codec.TypeOf<typeof Subtype>;

export type Image = { type: 'image'; subtype: ImageSubtype };
export type Video = { type: 'video', subtype: VideoSubtype };
export type Data = Image | Video;

export function toString (data: Data) { return `${data.type}/${data.subtype}` }

export const imageExtensions = new Map<string, ImageSubtype>([
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

export const videoExtensions = new Map<string, VideoSubtype>([
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
