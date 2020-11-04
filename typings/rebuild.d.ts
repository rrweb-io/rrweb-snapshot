import { serializedNodeWithId, idNodeMap, INode, CallbackArray } from './types';
export declare function addHoverClass(cssText: string): string;
export declare function buildNodeWithSN(n: serializedNodeWithId, options: {
    doc: Document;
    map: idNodeMap;
    cbs: CallbackArray;
    skipChild?: boolean;
    hackCss: boolean;
}): [INode | null, serializedNodeWithId[]];
declare function rebuild(n: serializedNodeWithId, options: {
    doc: Document;
    onVisit?: (node: INode) => unknown;
    hackCss?: boolean;
}): [Node | null, idNodeMap];
export default rebuild;
