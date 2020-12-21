import PDFDocument from 'pdfkit'
import fs from 'fs'
import {
  createRenderer,
  CreateAppFunction
} from 'vue'

import {
  getStyleValue,
  styleRules,
  StyleRule
} from './styling'
import {
  PDFDocumentElement,
  PDFElement,
  PDFElements,
  PDFNode,
  PDFRenderable,
  PDFTextNode,
  NodeMap
} from './elements'
import { createNodeOps } from './nodeOps'

// Modelled after https://github.com/vuejs/vue-next/blob/master/packages/runtime-dom/src/index.ts#L61
export const createApp = ((...args) => {
  const nodeMap: NodeMap = {}

  // createNodeOps mutations nodeMap
  // TODO: is there a way to avoid this?
  const nodeOps = createNodeOps(nodeMap)
  const renderer = createRenderer<PDFNode, PDFElements>(nodeOps)

  const app = renderer.createApp(...args)
  const pdf = new PDFDocument()

  const { mount } = app

  // Vue Core types this as `any` too
  // https://github.com/vuejs/vue-next/blob/3626ff07fe5107080c52e85018070562c84b796e/packages/runtime-dom/src/index.ts#L61
  app.mount = (doc: PDFDocumentElement): any => {
    const proxy = mount(doc)
    renderToPDF(doc, pdf, nodeMap)
    return proxy
  }
  return app
}) as CreateAppFunction<PDFElement>

function renderToPDF(doc: PDFDocumentElement, pdf: typeof PDFDocument, nodeMap: NodeMap) {
  const stream = pdf.pipe(fs.createWriteStream(doc.filename))

  const draw = (node: PDFRenderable) => {
    if (node instanceof PDFElement) {
      for (const rule of styleRules) {
        applyStyle(rule, node)
      }
    }

    if (node instanceof PDFTextNode) {
      const align = getStyleValue('align', node, nodeMap)
      pdf.text(node.value, {
        align
      })
    }
  }

  const traverse = (node: PDFRenderable) => {
    if (node instanceof PDFElement) {

      for (const child of node.children) {
        draw(nodeMap[child])
        traverse(nodeMap[child])
      }
    }
  }

  // delete nodeMap['root']['_vnode']
  // delete nodeMap['root']['__vue_app__']

  const applyStyle = (rule: StyleRule, node: PDFElements) => {
    const value = getStyleValue(rule, node, nodeMap)

    if (!value) {
      throw Error(`Not default style found for ${rule}`)
    }

    if (rule === 'color') {
      const value = getStyleValue(rule, node, nodeMap)
      pdf.fill(value)
    }

    if (rule === 'fontSize') {
      const value = getStyleValue(rule, node, nodeMap)!
      pdf.fontSize(value)
    }
  }

  const rootNode = nodeMap['root']
  traverse(rootNode)

  pdf.end()
  stream.on('finish', () => {
    console.log('\nWrote to file.pdf.')
  })
}