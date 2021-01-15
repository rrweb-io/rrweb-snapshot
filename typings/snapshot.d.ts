import { serializedNodeWithId, INode, idNodeMap, MaskInputOptions, SlimDOMOptions } from './types';
export declare const IGNORED_NODE = -2;
export declare function absoluteToStylesheet(cssText: string | null, href: string): string;
export declare function absoluteToDoc(doc: Document, attributeValue: string): string;
export declare function transformAttribute(doc: Document, name: string, value: string): string;
export declare function _isBlockedElement(element: HTMLElement, blockClass: string | RegExp, blockSelector: string | null): boolean;
export declare function serializeNodeWithId(n: Node | INode, options: {
    doc: Document;
    map: idNodeMap;
    blockClass: string | RegExp;
    blockSelector: string | null;
    skipChild: boolean;
    inlineStylesheet: boolean;
    maskInputOptions?: MaskInputOptions;
    slimDOMOptions: SlimDOMOptions;
    recordCanvas?: boolean;
    preserveWhiteSpace?: boolean;
}): serializedNodeWithId | null;
declare function snapshot(n: Document, options?: {
    blockClass?: string | RegExp;
    inlineStylesheet?: boolean;
    maskAllInputs?: boolean | MaskInputOptions;
    slimDOM?: boolean | SlimDOMOptions;
    recordCanvas?: boolean;
    blockSelector?: string | null;
}): [serializedNodeWithId | null, idNodeMap];
export declare function visitSnapshot(node: serializedNodeWithId, onVisit: (node: serializedNodeWithId) => unknown): void;
export declare function cleanupSnapshot(): void;
export default snapshot;
