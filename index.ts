import PDFDocument from 'pdfkit'
import { createRenderer, RendererOptions, h, defineComponent, computed } from '@vue/runtime-core'
import { baseCompile } from '@vue/compiler-core'
import { compile } from 'vue'

type NodeType =
  'Text'
  | 'List'
  | 'ListItem'
  | 'View'

const nodesTypes: NodeType[] = [
  'Text'
  , 'List'
  , 'ListItem'
  , 'View'
]

export const createNodeOps = (pdf: typeof PDFDocument): RendererOptions<any, any> => ({
  patchProp: (...args) => {
    console.log(`patchProp`, args[0])
  },

  forcePatchProp: (el: any, key: string) => {
    console.log('forcePatchProp')
    return false
  },

  insert: (...args) => {
    console.log(`insert:`)
    console.log('args[0]', args[0])
    // console.log('args[1]', args[1])
    console.log('args[2]', args[2])
  },

  remove: child => {
    console.log('remove')
  },

  createElement: (tag: NodeType): any => {
    if (!nodesTypes.includes(tag)) {
      throw Error(`${tag} is not a valid tag`)
    }

    if (tag === 'Text') {
      // pdf.text(
    }
    console.log(`createElement: ${tag}`)
    return {
      tag
    }
  },

  createText: text => {
    console.log(`createText ${text}`)
    return {
      type: 'text',
      value: text
    }
    // textCache.value = text
  },

  createComment: text => {
    console.log(`createComment ${text}`)
  },

  setText: (node, text) => {
    console.log(`setText ${text}`)
  },

  setElementText: (el, text) => {
    console.log(`setElementText: ${text}`)
  },

  parentNode: node => {
    console.log('parentNode')
    return pdf
  },

  nextSibling: node => {
    console.log('nextSibling', node)
    return {}
  },

  querySelector: selector => {
    console.log('querySelector', selector)
    // no-op
    return null
  },

  setScopeId(el, id) {
    console.log('setScopeId')
  },

  cloneNode(el) {
    console.log('cloneNode')
    return {...el}
  },

  insertStaticContent(content, parent, anchor, isSVG) {
    console.log('insert static content')
    return []
  }
})
