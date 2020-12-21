import PDFDocument from 'pdfkit'
import fs from 'fs'
import {
  h,
  RendererOptions,
  createRenderer,
  defineComponent,
  compile
} from 'vue'

import {
  defaults,
  getStyleValue,
  styleRules,
  StyleRule
} from './styling'
import {
  PDFDocumentElement,
  PDFElement,
  PDFElements,
  PDFNode,
  PDFNodes,
  PDFRenderable,
  PDFTextElement,
  PDFTextNode,
  PDFViewElement,
  Tag,
  NodeMap
} from './elements'
import { createNodeOps } from './nodeOps'

const createPDFComponent = (tag: Tag) =>
  defineComponent({
    inheritAttrs: false,
    name: tag,
    render() {
      return h(tag, this.$attrs, this.$slots?.default?.() || [])
    }
  })

const View = createPDFComponent('View')
const Text = createPDFComponent('Text')
const Document = createPDFComponent('Document')

const App = defineComponent({
  components: { Text, View },
  data() {
    return {
      colors: ['red', 'blue', 'green']
    }
  },
  render: compile(`
    <View>
      <View :styles="{color: 'red'}">
        <Text v-for="color in colors" :styles="{color, fontSize: color === 'blue' ? 25 : null}">
          {{ color }}
        </Text>
      </View>
      <Text>Default</Text>
      <Text :styles="{color: 'yellow'}">Yellow</Text>
      <Text :styles="{fontSize: 15}">Font size 15</Text>
      <Text :styles="{fontSize: 30}">Font size 30</Text>
    </View>
  `)
})

const root = new PDFDocumentElement('Document')

const nodeMap: NodeMap = {}
// createNodeOps mutations nodeMap
// TODO: is there a way to avoid this?
const nodeOps = createNodeOps(nodeMap)

const { createApp } = createRenderer<PDFNode, PDFElements>(nodeOps)
createApp(App).mount(root)
delete nodeMap['root']['_vnode']
delete nodeMap['root']['__vue_app__']

const pdf = new PDFDocument()
const stream = pdf.pipe(fs.createWriteStream('./file.pdf'))

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

const draw = (node: PDFRenderable) => {
  if (node instanceof PDFElement) {
    for (const rule of styleRules) {
      console.log(`Drawing ${rule} for ${node.id} with styles ${node.styles}`)
      applyStyle(rule, node)
    }
  }

  if (node instanceof PDFTextNode) {
    pdf.text(node.value)
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

const rootNode = nodeMap['root']

traverse(rootNode)
pdf.end()
stream.on('finish', () => {
  console.log('Wrote to file.pdf.')
})