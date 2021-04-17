import { serializedNodeWithId, INode, idNodeMap, MaskInputOptions, MaskTextFn, SlimDOMOptions } from './types';
export declare const IGNORED_NODE = -2;
export declare function absoluteToStylesheet(cssText: string | null, href: string): string;
export declare function absoluteToDoc(doc: Document, attributeValue: string): string;
export declare function transformAttribute(doc: Document, tagName: string, name: string, value: string): string;
export declare function _isBlockedElement(element: HTMLElement, blockClass: string | RegExp, blockSelector: string | null): boolean;
export declare function needMasking(node: Node | null, maskClass: string | RegExp, maskSelector: string | null): boolean;
export declare function serializeNodeWithId(n: Node | INode, options: {
    doc: Document;
    map: idNodeMap;
    blockClass: string | RegExp;
    blockSelector: string | null;
    maskClass: string | RegExp;
    maskSelector: string | null;
    skipChild: boolean;
    inlineStylesheet: boolean;
    maskInputOptions?: MaskInputOptions;
    maskTextFn?: MaskTextFn;
    slimDOMOptions: SlimDOMOptions;
    recordCanvas?: boolean;
    preserveWhiteSpace?: boolean;
    onSerialize?: (n: INode) => unknown;
    onIframeLoad?: (iframeINode: INode, node: serializedNodeWithId) => unknown;
    iframeLoadTimeout?: number;
}): serializedNodeWithId | null;
declare function snapshot(n: Document, options?: {
    blockClass?: string | RegExp;
    blockSelector?: string | null;
    maskClass?: string | RegExp;
    maskSelector?: string | null;
    inlineStylesheet?: boolean;
    maskAllInputs?: boolean | MaskInputOptions;
    maskTextFn?: MaskTextFn;
    slimDOM?: boolean | SlimDOMOptions;
    recordCanvas?: boolean;
    preserveWhiteSpace?: boolean;
    onSerialize?: (n: INode) => unknown;
    onIframeLoad?: (iframeINode: INode, node: serializedNodeWithId) => unknown;
    iframeLoadTimeout?: number;
}): [serializedNodeWithId | null, idNodeMap];
export declare function visitSnapshot(node: serializedNodeWithId, onVisit: (node: serializedNodeWithId) => unknown): void;
export declare function cleanupSnapshot(): void;
export default snapshot;
