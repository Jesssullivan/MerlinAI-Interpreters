/**
 *  annotator_photo.ts
 *
 * implementations of `annotator_tool` for annotating photos.
 *
 * build only this file:
 * ` npm run-script build-photo `
 *
 * build all files:
 * ` npm run-script build `
 */
declare let annotatorRendered: any;
declare let currentImageIndex: number;
declare function startAnnotating(images_data: any[], categories: any, annotations: Array<{
    [x: string]: any;
}>, config: {
    quickAccessCategoryIDs: any[];
    annotationFilePrefix: string;
}): void;
declare function getQuickAccessCategoryIDs(): string[] | number[];
declare let i: void;
declare const isChromium: any;
declare const winNav: Navigator;
declare const vendorName: string;
declare const isOpera: boolean;
declare const isIEedge: boolean;
declare const isIOSChrome: RegExpMatchArray;
