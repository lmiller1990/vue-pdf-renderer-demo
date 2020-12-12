import PDFDocument from 'pdfkit'
import fs from 'fs'
import { createRenderer, RendererOptions, h, defineComponent, computed } from '@vue/runtime-core'
import { baseCompile } from '@vue/compiler-core'
import { compile } from 'vue'

enum NodeTypes {
  Text = 'Text',
  List = 'List',
  ListItem = 'ListItem',
  Liew = 'View'
}


export const createNodeOps = (pdf: typeof PDFDocument): RendererOptions<any, any> => ({
  patchProp: (...args) => {
    console.log(`patchProp`, args[0])
  },

  forcePatchProp: (el: any, key: string) => {
    console.log('forcePatchProp')
    return false
  },

  insert: (...args) => {
    console.log(`insert: ${args}`)
  },

  remove: child => {
    console.log('remove')
  },

  createElement: (tag: NodeTypes): any => {
    console.log(`createElement ${tag}`)
    return {}
    // throw Error(`Unknown tag type: ${tag}`)
  },

  createText: text => {
    console.log(`createText ${text}`)
    // textCache.value = text
  },

  createComment: text => {
    console.log('createComment')
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
