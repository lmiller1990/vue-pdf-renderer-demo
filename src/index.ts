import PDFDocument from 'pdfkit'
import fs from 'fs'
import { h, RendererOptions, createRenderer, defineComponent, compile } from 'vue'

class PDFNode {
  id: string = (Math.random() * 10000).toFixed(0)
}

class PDFTextNode extends PDFNode {
  parent?: string
  value: string

  constructor(value: string) {
    super()
    this.value = value
  }
}

type StyleRule = 'color' | 'fontSize'

type Styles = {
  [key in StyleRule]?: string
}

const styleRules: StyleRule[] = ['color', 'fontSize']

class PDFElement extends PDFNode {
  styles: Styles = {} 
}

class PDFDocumentElement extends PDFElement {
  id = 'root'
  children: string[] = []
}

class PDFTextElement extends PDFElement {
  parent?: string
  children: string[] = []
}

class PDFViewElement extends PDFElement {
  parent?: string
  children: string[] = []
}

type PDFRenderable = PDFTextNode | PDFTextElement | PDFDocumentElement

type PDFNodes = PDFTextNode
type PDFElements = PDFTextElement | PDFDocumentElement | PDFViewElement

const nodeMap: Record<string, PDFNodes | PDFElements> = {}

function noop(fn: string): any {
  throw Error(`no-op: ${fn}`)
}

const createPDFComponent = (tag: string) => 
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

export const nodeOps: RendererOptions<PDFNodes, PDFElements> = {
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

    if (! (child.id in nodeMap)) {
      nodeMap[child.id] = child
    }

    parent.children.push(child.id)
    child.parent = parent.id
  },

  createElement: (tag: 'Text' | 'Document' | 'View') => {
    if (tag === 'Text') {
      return new PDFTextElement()
    }

    if (tag === 'View') {
      return new PDFViewElement()
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

const root = new PDFDocumentElement()

const { createApp } = createRenderer<PDFNode, PDFElements>(nodeOps)
const app = createApp(App).mount(root)
delete nodeMap['root']['_vnode']
delete nodeMap['root']['__vue_app__']

const pdf = new PDFDocument()
const stream = pdf.pipe(fs.createWriteStream('./file.pdf'))

const defaults: Record<string, any> = {
  color: 'black',
  fontSize: 14
}

const getParentStyle = (attr: string, parent: PDFRenderable): string | number => {
  // we are at the root <Document> element.
  if (parent instanceof PDFDocumentElement) {
    return defaults[attr]
  }

  // check parent for style.
  if (parent instanceof PDFElement) {
    if (parent.styles[attr]) {
      return parent.styles[attr]
    }
  }

  // recurse up the tree.
  return getParentStyle(attr, nodeMap[parent.parent!])
}

const getStyleValue = (rule: StyleRule, node: PDFElement) => {
  if (rule in node.styles && node.styles[rule]) {
    return node.styles[rule]
  }

  // @ts-ignore
  return getParentStyle(rule, nodeMap[node.parent!])
}

const applyStyle = (rule: StyleRule, node: PDFElement) => {
  const value = getStyleValue(rule, node)

  if (!value) {
    throw Error(`Not default style found for ${rule}`)
  }

  switch (rule) {
    case 'color': {
      // @ts-ignore
      pdf.fill(value)
    }

    case 'fontSize': {
      // @ts-ignore
      pdf.fontSize(value)
    }
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

console.log(nodeMap)

const rootNode = nodeMap['root']

traverse(rootNode)
pdf.end()
stream.on('finish', () => {
  console.log('Wrote to file.pdf.')
})