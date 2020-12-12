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

  forcePatchProp: (el: any, key: string) => {
    return false
  },

  insert: (child, parent, anchor) => {
    if (parent.type === 'Document') {
      nodeMap['root'] = parent
    }

    if (!(child.id in nodeMap)) {
      nodeMap[child.id] = child
    }

    console.log(`Setting el ${child.type} (${child.id}) parent to ${parent.id}`)
    parent.children.push(child.id)
    child.parent = parent.id
  },

  remove: child => {
    console.log('remove')
  },

  createElement: (tag: NodeType): any => {
    console.log(`createElement: ${tag}`)

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

  createComment: text => {
    throw Error(`no-op`)
  },

  setText: (node, text) => {
  },

  setElementText: (el, text) => {
  },

  parentNode: node => {
    return node.parent ? nodeMap[node.parent] : null
  },

  nextSibling: node => {
    throw Error(`no-op`)
  },

  querySelector: selector => {
    // no-op
    return null
  },

  setScopeId(el, id) {
  },

  cloneNode(el) {
    return {...el}
  },

  insertStaticContent(content, parent, anchor, isSVG) {
    return []
  }
})
