import {
  RendererOptions,
} from 'vue'

import {
  NodeMap,
  PDFDocumentElement,
  PDFElements,
  PDFNodes,
  PDFTextElement,
  PDFTextNode,
  PDFViewElement,
  Tag,
} from './elements'

function noop(fn: string): any {
  throw Error(`no-op: ${fn}`)
}

export function createNodeOps(nodeMap: NodeMap): RendererOptions<PDFNodes, PDFElements> {
  return {
    patchProp: (el, key, preaVal, nextVal: Record<string, any>) => {
      if (nextVal && key === 'styles') {
        for (const [attr, value] of Object.entries(nextVal)) {
          el.styles[attr] = value
        }
      }
    },

    insert: (child, parent, anchor) => {
      if (parent instanceof PDFDocumentElement) {
        nodeMap[parent.id] = parent
      }

      if (!(child.id in nodeMap)) {
        nodeMap[child.id] = child
      }

      parent.children.push(child.id)
      child._parent = parent.id
    },

    createElement: (tag: Tag) => {
      if (tag === 'Text') {
        return new PDFTextElement(tag)
      }

      if (tag === 'View') {
        return new PDFViewElement(tag)
      }

      throw Error(`Unknown tag ${tag}`)
    },

    createText: (text: string) => {
      return new PDFTextNode(text)
    },

    parentNode: node => {
      return null
    },

    createComment: () => noop('createComment'),
    setText: () => noop('setText'),
    setElementText: () => noop('setElementText'),
    nextSibling: () => noop('nextSibling'),
    querySelector: () => noop('querySelector'),
    setScopeId: () => noop('setScopeId'),
    cloneNode: () => noop('cloneNode'),
    insertStaticContent: () => noop('insertStaticContent'),
    forcePatchProp: () => noop('forcePatchProp'),
    remove: () => noop('remove'),
  }
}
