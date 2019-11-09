"use strict";
exports.__esModule = true;
var css_1 = require("./css");
var types_1 = require("./types");
var tagMap = {
    script: 'noscript',
    altglyph: 'altGlyph',
    altglyphdef: 'altGlyphDef',
    altglyphitem: 'altGlyphItem',
    animatecolor: 'animateColor',
    animatemotion: 'animateMotion',
    animatetransform: 'animateTransform',
    clippath: 'clipPath',
    feblend: 'feBlend',
    fecolormatrix: 'feColorMatrix',
    fecomponenttransfer: 'feComponentTransfer',
    fecomposite: 'feComposite',
    feconvolvematrix: 'feConvolveMatrix',
    fediffuselighting: 'feDiffuseLighting',
    fedisplacementmap: 'feDisplacementMap',
    fedistantlight: 'feDistantLight',
    fedropshadow: 'feDropShadow',
    feflood: 'feFlood',
    fefunca: 'feFuncA',
    fefuncb: 'feFuncB',
    fefuncg: 'feFuncG',
    fefuncr: 'feFuncR',
    fegaussianblur: 'feGaussianBlur',
    feimage: 'feImage',
    femerge: 'feMerge',
    femergenode: 'feMergeNode',
    femorphology: 'feMorphology',
    feoffset: 'feOffset',
    fepointlight: 'fePointLight',
    fespecularlighting: 'feSpecularLighting',
    fespotlight: 'feSpotLight',
    fetile: 'feTile',
    feturbulence: 'feTurbulence',
    foreignobject: 'foreignObject',
    glyphref: 'glyphRef',
    lineargradient: 'linearGradient',
    radialgradient: 'radialGradient'
};
function getTagName(n) {
    var tagName = tagMap[n.tagName] ? tagMap[n.tagName] : n.tagName;
    if (tagName === 'link' && n.attributes._cssText) {
        tagName = 'style';
    }
    return tagName;
}
var HOVER_SELECTOR = /([^\\]):hover/g;
function addHoverClass(cssText) {
    var ast = css_1.parse(cssText, { silent: true });
    if (!ast.stylesheet) {
        return cssText;
    }
    ast.stylesheet.rules.forEach(function (rule) {
        if ('selectors' in rule) {
            (rule.selectors || []).forEach(function (selector) {
                if (HOVER_SELECTOR.test(selector)) {
                    var newSelector = selector.replace(HOVER_SELECTOR, '$1.\\:hover');
                    cssText = cssText.replace(selector, selector + ", " + newSelector);
                }
            });
        }
    });
    return cssText;
}
exports.addHoverClass = addHoverClass;
function buildNode(n, doc, HACK_CSS) {
    switch (n.type) {
        case types_1.NodeType.Document:
            return doc.implementation.createDocument(null, '', null);
        case types_1.NodeType.DocumentType:
            return doc.implementation.createDocumentType(n.name, n.publicId, n.systemId);
        case types_1.NodeType.Element:
            var tagName = getTagName(n);
            var node = void 0;
            if (n.isSVG) {
                node = doc.createElementNS('http://www.w3.org/2000/svg', tagName);
            }
            else {
                node = doc.createElement(tagName);
            }
            for (var name_1 in n.attributes) {
                if (n.attributes.hasOwnProperty(name_1) && !name_1.startsWith('rr_')) {
                    var value = n.attributes[name_1];
                    value = typeof value === 'boolean' ? '' : value;
                    var isTextarea = tagName === 'textarea' && name_1 === 'value';
                    var isRemoteOrDynamicCss = tagName === 'style' && name_1 === '_cssText';
                    if (isRemoteOrDynamicCss && HACK_CSS) {
                        value = addHoverClass(value);
                    }
                    if (isTextarea || isRemoteOrDynamicCss) {
                        var child = doc.createTextNode(value);
                        for (var _i = 0, _a = Array.from(node.childNodes); _i < _a.length; _i++) {
                            var c = _a[_i];
                            if (c.nodeType === node.TEXT_NODE) {
                                node.removeChild(c);
                            }
                        }
                        node.appendChild(child);
                        continue;
                    }
                    if (tagName === 'iframe' && name_1 === 'src') {
                        continue;
                    }
                    try {
                        if (n.isSVG && name_1 === 'xlink:href') {
                            node.setAttributeNS('http://www.w3.org/1999/xlink', name_1, value);
                        }
                        else {
                            node.setAttribute(name_1, value);
                        }
                    }
                    catch (error) {
                    }
                }
                else {
                    if (n.attributes.rr_width) {
                        node.style.width = n.attributes.rr_width;
                    }
                    if (n.attributes.rr_height) {
                        node.style.height = n.attributes
                            .rr_height;
                    }
                }
            }
            return node;
        case types_1.NodeType.Text:
            return doc.createTextNode(n.isStyle && HACK_CSS ? addHoverClass(n.textContent) : n.textContent);
        case types_1.NodeType.CDATA:
            return doc.createCDATASection(n.textContent);
        case types_1.NodeType.Comment:
            return doc.createComment(n.textContent);
        default:
            return null;
    }
}
function buildNodeWithSN(n, doc, map, skipChild, HACK_CSS) {
    if (skipChild === void 0) { skipChild = false; }
    if (HACK_CSS === void 0) { HACK_CSS = true; }
    var node = buildNode(n, doc, HACK_CSS);
    if (!node) {
        return null;
    }
    if (n.type === types_1.NodeType.Document) {
        doc.close();
        doc.open();
        node = doc;
    }
    node.__sn = n;
    map[n.id] = node;
    if ((n.type === types_1.NodeType.Document || n.type === types_1.NodeType.Element) &&
        !skipChild) {
        for (var _i = 0, _a = n.childNodes; _i < _a.length; _i++) {
            var childN = _a[_i];
            var childNode = buildNodeWithSN(childN, doc, map, false, HACK_CSS);
            if (!childNode) {
                console.warn('Failed to rebuild', childN);
            }
            else {
                node.appendChild(childNode);
            }
        }
    }
    return node;
}
exports.buildNodeWithSN = buildNodeWithSN;
function rebuild(n, doc, HACK_CSS) {
    if (HACK_CSS === void 0) { HACK_CSS = true; }
    var idNodeMap = {};
    return [buildNodeWithSN(n, doc, idNodeMap, false, HACK_CSS), idNodeMap];
}
exports["default"] = rebuild;
//# sourceMappingURL=rebuild.js.map