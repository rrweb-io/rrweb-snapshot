import { serializedNodeWithId, idNodeMap, INode, callbackArray } from './types';
export declare function addHoverClass(cssText: string): string;
export declare function buildNodeWithSN(n: serializedNodeWithId, doc: Document, map: idNodeMap, cbs: callbackArray, skipChild?: boolean): [INode | null, serializedNodeWithId[]];
declare function rebuild(n: serializedNodeWithId, doc: Document): [Node | null, idNodeMap];
export default rebuild;
