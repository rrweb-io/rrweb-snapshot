import { serializedNodeWithId, idNodeMap, snapshotOptions, serializeOptions } from './types';
export declare function resetId(): void;
export declare function absoluteToStylesheet(cssText: string, href: string): string;
export declare function serializeNodeWithId(n: Node, doc: Document, map: idNodeMap, options?: serializeOptions): serializedNodeWithId | null;
declare function snapshot(n: Document, options?: snapshotOptions): [serializedNodeWithId | null, idNodeMap];
export default snapshot;
