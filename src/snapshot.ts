import {
  serializedNode,
  serializedNodeWithId,
  NodeType,
  attributes,
  INode,
  idNodeMap,
  snapshotOptions,
  serializeOptions,
} from './types';

let _id = 1;

function genId(): number {
  return _id++;
}

export function resetId() {
  _id = 1;
}

function getCssRulesString(s: CSSStyleSheet): string | null {
  try {
    const rules = s.rules || s.cssRules;
    return rules
      ? Array.from(rules).reduce((prev, cur) => (prev += cur.cssText), '')
      : null;
  } catch (error) {
    return null;
  }
}

function extractOrigin(url: string): string {
  let origin;
  if (url.indexOf('//') > -1) {
    origin = url
      .split('/')
      .slice(0, 3)
      .join('/');
  } else {
    origin = url.split('/')[0];
  }
  origin = origin.split('?')[0];
  return origin;
}

const URL_IN_CSS_REF = /url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/gm;
const RELATIVE_PATH = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/;
const DATA_URI = /^(data:)([\w\/\+]+);(charset=[\w-]+|base64).*,(.*)/gi;
export function absoluteToStylesheet(cssText: string, href: string): string {
  return cssText.replace(URL_IN_CSS_REF, (origin, path1, path2, path3) => {
    const filePath = path1 || path2 || path3;
    if (!filePath) {
      return origin;
    }
    if (!RELATIVE_PATH.test(filePath)) {
      return `url('${filePath}')`;
    }
    if (DATA_URI.test(filePath)) {
      return `url(${filePath})`;
    }
    if (filePath[0] === '/') {
      return `url('${extractOrigin(href) + filePath}')`;
    }
    const stack = href.split('/');
    const parts = filePath.split('/');
    stack.pop();
    for (const part of parts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    return `url('${stack.join('/')}')`;
  });
}

function absoluteToDoc(doc: Document, attributeValue: string): string {
  const a: HTMLAnchorElement = doc.createElement('a');
  a.href = attributeValue;
  return a.href;
}

function isSVGElement(el: Element): boolean {
  return el.tagName === 'svg' || el instanceof SVGElement;
}

function serializeNode(
  n: Node,
  doc: Document,
  blockClass: string | RegExp,
): serializedNode | false {
  // Only record root id when document object is not the base document
  let rootId: number | undefined;
  if (((doc as unknown) as INode).__sn) {
    const docId = ((doc as unknown) as INode).__sn.id;
    rootId = docId === 1 ? undefined : docId;
  }
  switch (n.nodeType) {
    case n.DOCUMENT_NODE:
      return {
        type: NodeType.Document,
        childNodes: [],
        rootId,
      };
    case n.DOCUMENT_TYPE_NODE:
      return {
        type: NodeType.DocumentType,
        name: (n as DocumentType).name,
        publicId: (n as DocumentType).publicId,
        systemId: (n as DocumentType).systemId,
        rootId,
      };
    case n.ELEMENT_NODE:
      let needBlock = false;
      if (typeof blockClass === 'string') {
        needBlock = (n as HTMLElement).classList.contains(blockClass);
      } else {
        (n as HTMLElement).classList.forEach(className => {
          if (blockClass.test(className)) {
            needBlock = true;
          }
        });
      }
      const tagName = (n as HTMLElement).tagName.toLowerCase();
      let attributes: attributes = {};
      for (const { name, value } of Array.from((n as HTMLElement).attributes)) {
        // relative path in attribute
        if (name === 'src' || name === 'href') {
          attributes[name] = absoluteToDoc(doc, value);
        } else if (name === 'style') {
          attributes[name] = absoluteToStylesheet(value, location.href);
        } else {
          attributes[name] = value;
        }
      }
      // remote css
      if (tagName === 'link') {
        const stylesheet = Array.from(doc.styleSheets).find(s => {
          return s.href === (n as HTMLLinkElement).href;
        });
        const cssText = getCssRulesString(stylesheet as CSSStyleSheet);
        if (cssText) {
          delete attributes.rel;
          delete attributes.href;
          attributes._cssText = absoluteToStylesheet(
            cssText,
            stylesheet!.href!,
          );
        }
      }
      // dynamic stylesheet
      if (
        tagName === 'style' &&
        (n as HTMLStyleElement).sheet &&
        // TODO: Currently we only try to get dynamic stylesheet when it is an empty style element
        !(n as HTMLElement).innerText.trim().length
      ) {
        const cssText = getCssRulesString((n as HTMLStyleElement)
          .sheet as CSSStyleSheet);
        if (cssText) {
          attributes._cssText = absoluteToStylesheet(cssText, location.href);
        }
      }
      // form fields
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select'
      ) {
        const value = (n as HTMLInputElement | HTMLTextAreaElement).value;
        if (
          attributes.type !== 'radio' &&
          attributes.type !== 'checkbox' &&
          value
        ) {
          attributes.value = value;
        } else if ((n as HTMLInputElement).checked) {
          attributes.checked = (n as HTMLInputElement).checked;
        }
      }
      if (tagName === 'option') {
        const selectValue = (n as HTMLOptionElement).parentElement;
        if (attributes.value === (selectValue as HTMLSelectElement).value) {
          attributes.selected = (n as HTMLOptionElement).selected;
        }
      }
      if (needBlock) {
        const { width, height } = (n as HTMLElement).getBoundingClientRect();
        attributes.rr_width = `${width}px`;
        attributes.rr_height = `${height}px`;
      }
      return {
        type: NodeType.Element,
        tagName,
        attributes,
        childNodes: [],
        isSVG: isSVGElement(n as Element) || undefined,
        needBlock,
        rootId,
      };
    case n.TEXT_NODE:
      // The parent node may not be a html element which has a tagName attribute.
      // So just let it be undefined which is ok in this use case.
      const parentTagName =
        n.parentNode && (n.parentNode as HTMLElement).tagName;
      let textContent = (n as Text).textContent;
      const isStyle = parentTagName === 'STYLE' ? true : undefined;
      if (isStyle && textContent) {
        textContent = absoluteToStylesheet(textContent, location.href);
      }
      if (parentTagName === 'SCRIPT') {
        textContent = 'SCRIPT_PLACEHOLDER';
      }
      return {
        type: NodeType.Text,
        textContent: textContent || '',
        isStyle,
        rootId,
      };
    case n.CDATA_SECTION_NODE:
      return {
        type: NodeType.CDATA,
        textContent: '',
        rootId,
      };
    case n.COMMENT_NODE:
      return {
        type: NodeType.Comment,
        textContent: (n as Comment).textContent || '',
        rootId,
      };
    default:
      return false;
  }
}

export function serializeNodeWithId(
  n: Node,
  doc: Document,
  map: idNodeMap,
  options: serializeOptions = {},
): serializedNodeWithId | null {
  const { blockClass = 'rr-block', skipChild = false, onVisit } = options;
  const _serializedNode = serializeNode(n, doc, blockClass);
  if (!_serializedNode) {
    // TODO: dev only
    console.warn(n, 'not serialized');
    return null;
  }
  const serializedNode = Object.assign(_serializedNode, {
    id: genId(),
  });
  (n as INode).__sn = serializedNode;
  map[serializedNode.id] = n as INode;
  if (onVisit) {
    onVisit(n as INode);
  }
  let recordChild = !skipChild;
  if (serializedNode.type === NodeType.Element) {
    recordChild = recordChild && !serializedNode.needBlock;
    // this property was not needed in replay side
    delete serializedNode.needBlock;
  }
  if (
    (serializedNode.type === NodeType.Document ||
      serializedNode.type === NodeType.Element) &&
    recordChild
  ) {
    for (const childN of Array.from(n.childNodes)) {
      const serializedChildNode = serializeNodeWithId(
        childN,
        doc,
        map,
        options,
      );
      if (serializedChildNode) {
        serializedNode.childNodes.push(serializedChildNode);
      }
    }
  }
  if (
    serializedNode.type === NodeType.Element &&
    serializedNode.tagName === 'iframe'
  ) {
    const iframeDoc = (n as HTMLIFrameElement).contentDocument;
    if (iframeDoc) {
      const serializedIframeNode = serializeNodeWithId(
        iframeDoc,
        iframeDoc,
        map,
        options,
      );
      if (serializedIframeNode) {
        serializedNode.childNodes.push(serializedIframeNode);
      }
    }
  }
  return serializedNode;
}

function snapshot(
  n: Document,
  options?: snapshotOptions,
): [serializedNodeWithId | null, idNodeMap] {
  resetId();
  const idNodeMap: idNodeMap = {};
  return [serializeNodeWithId(n, n, idNodeMap, options), idNodeMap];
}

export default snapshot;
