import { RendererOptions } from '@vue/runtime-core'

export interface PDFNode {
  id: string
  type: NodeType
  styles: {
    color?: string
  }
  value?: string
  parent?: string
  children: string[]
}

type NodeType =
  'Text'
  | 'View'
  | 'RawText'
  | 'Document'

const nodesTypes: NodeType[] = [
  'Text'
  , 'View'
  , 'RawText'
  , 'Document'
]

type SupportedAttrs = 'styles'

export const nodeMap: Record<string, PDFNode> = {}

export const createNodeOps = (): RendererOptions<PDFNode, PDFNode> => ({
  // el
  // key
  // prevVal
  // nextVal
  // isSvg
  // prevChild
  // ...
  patchProp: (el, key: SupportedAttrs, prevVal, nextVal) => {
    if (nextVal && key === 'styles') {
      el.styles = nextVal
    }
  },

  insert: (child, parent, anchor) => {
    if (parent.type === 'Document') {
      nodeMap['root'] = parent
    }

    if (!(child.id in nodeMap)) {
      nodeMap[child.id] = child
    }

    parent.children.push(child.id)
    child.parent = parent.id
  },

  createElement: (tag: NodeType): any => {
    if (!nodesTypes.includes(tag)) {
      throw Error(`${tag} is not a valid tag`)
    }

    return {
      id: (Math.random() * 10000).toFixed(0),
      type: tag,
      children: [],
      styles: {},
    }
  },

  createText: text => {
    return {
      id: (Math.random() * 10000).toFixed(0),
      type: 'RawText',
      value: text,
      children: [],
      styles: {},
      parent: undefined
    }
  },

  parentNode: node => {
    return node.parent ? nodeMap[node.parent] : null
  },

  createComment: text => {
    throw Error(`no-op`)
  },

  setText: (node, text) => {
    throw Error(`no-op`)
  },

  setElementText: (el, text) => {
    throw Error(`no-op`)
  },
  nextSibling: node => {
    throw Error(`no-op`)
  },

  querySelector: selector => {
    throw Error(`no-op`)
  },

  setScopeId(el, id) {
    throw Error(`no-op`)
  },

  cloneNode(el) {
    throw Error(`no-op`)
  },

  insertStaticContent(content, parent, anchor, isSVG) {
    throw Error(`no-op`)
  },

  forcePatchProp: (el: any, key: string) => {
    throw Error(`no-op`)
  },

  remove: child => {
    throw Error(`no-op`)
  }
})
