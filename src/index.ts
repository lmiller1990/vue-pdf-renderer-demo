import { h, RendererOptions, createRenderer, defineComponent, compile } from 'vue'

type PDFNodeType = 'RawText' | 'Text' | 'Document'

class PDFTextNode {
  id: string
  parent?: string
  value: string

  constructor(value: string) {
    this.id = (Math.random() * 10000).toFixed(0)
    this.value = value
  }
}

class PDFElement {}

class PDFDocumentElement extends PDFElement {
  id: string
  children: string[] = []

  constructor() {
    super()
    this.id = (Math.random() * 10000).toFixed(0)
  }
}

class PDFTextElement extends PDFElement {
  id: string
  parent?: string
  children: string[] = []

  constructor() {
    super()
    this.id = (Math.random() * 10000).toFixed(0)
  }
}

type PDFRenderable = PDFTextNode | PDFTextElement | PDFDocumentElement

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

export const nodeOps: RendererOptions<PDFTextNode, PDFTextElement | PDFDocumentElement> = {
  patchProp: (el, key, prevVal, nextVal) => {
    console.log('patchProp', { el, key, prevVal, nextVal })
  },

  insert: (child, parent, anchor) => {
    console.log('insert', { parent, child })
    if (parent instanceof PDFDocumentElement) {
      nodeMap['root'] = parent
    }

    if (!(child.id in nodeMap)) {
      nodeMap[child.id] = child
    }

    parent.children.push(child.id)

    if (child.parent) {
      child.parent = parent.id
    }
  },

  createElement: (tag: 'Text' | 'Document') => {
    console.log(`createElement: ${tag}`)
    if (tag === 'Text') {
      return new PDFTextElement()
    }

    throw Error(`Unknown tag ${tag}`)
  },

  createText: (text: string) => {
    return new PDFTextNode(text)
  },

  parentNode: node => {
    console.log('parentNode')
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
  render: compile(`
    <Text>This is some text</Text>
  `)
})

const root = new PDFDocumentElement()

const { createApp } = createRenderer(nodeOps)
const app = createApp(App).mount(root)
delete nodeMap['root']['_vnode']
delete nodeMap['root']['__vue_app__']
console.log(JSON.stringify(nodeMap, null ,2))

const draw = (node: PDFRenderable) => {
  if (node instanceof PDFTextNode) {
    console.log(node.value)
    // console.log(`Writing: ${node.value}`)
    // pdf.text(node.value)
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