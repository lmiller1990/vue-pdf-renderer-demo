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

class PDFElement extends PDFNode {
  styles: Record<string, string> = {}
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

const nodeMap: Record<string, PDFTextNode | PDFTextElement> = {}

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
        <Text v-for="color in colors" :styles="{color}">
          {{ color }}
        </Text>
      </View>
      <Text>Default</Text>
      <Text :styles="{color: 'yellow'}">Yellow</Text>
    </View>
  `)
})

const root = new PDFDocumentElement()

const { createApp } = createRenderer<PDFNode, PDFElements>(nodeOps)
const app = createApp(App).mount(root)
delete nodeMap['root']['_vnode']
delete nodeMap['root']['__vue_app__']

const pdf = new PDFDocument()
pdf.fontSize(50)
const stream = pdf.pipe(fs.createWriteStream('./file.pdf'))

const defaults: Record<string, any> = {
  color: 'black'
}

const getParentStyle = (attr: string, parent: PDFRenderable): string => {
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

const draw = (node: PDFRenderable) => {
  if (node instanceof PDFElement) {
    if (node.styles.color) {
      pdf.fill(node.styles.color)
    } else {
      // @ts-ignore
      pdf.fill(getParentStyle('color', nodeMap[node.parent]))
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