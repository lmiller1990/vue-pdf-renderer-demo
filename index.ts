import PDFDocument from 'pdfkit'
import fs from 'fs'
import { createRenderer, RendererOptions, h, defineComponent, computed } from '@vue/runtime-core'
import { baseCompile } from '@vue/compiler-core'
import { compile } from 'vue'

enum NodeTypes {
  TEXT = 'TEXT',
  LIST = 'LIST',
  LIST_ITEM = 'LIST_ITEM'
}


interface ListCache {
  values: string[]
  styles: Record<string, any>
}

interface TextCache {
  value: string
  color?: string
}

let listItemsCache: ListCache = {
  styles: {},
  values: [],
}

let textCache: TextCache = {
  value: ''
}

const nodeOps: RendererOptions<any, any> = {
  patchProp: (...args) => {
    if (args[0]?.type === NodeTypes.LIST) {
      const attr = args[1]
      const val = args[3]
      listItemsCache.styles[attr] = val || true
    }

    if (args[0]?.type === NodeTypes.LIST_ITEM) {
      const children = typeof args[3] === 'function' && args[3]()
      if (!children) {
        return
      }

      if (children && children[0].type !== Text) {
        throw Error(`Child must be <Text />`)
      }
      listItemsCache.values.push(children[0].props.text)
    }
  },

  forcePatchProp: (el: any, key: string) => {
    console.log('forcePatchProp')
    return false
  },

  insert: (child, parent, anchor) => {
    if (!child) {
      return
    }

    if (child.type === NodeTypes.LIST) {
      if (listItemsCache.styles['color']) {
        pdf.fillColor(listItemsCache.styles['color'])
      }
      pdf.list(listItemsCache.values, listItemsCache.styles)
      listItemsCache.values = []
    }


    if (child.type === NodeTypes.LIST_ITEM) {
      console.log(`insert: ${NodeTypes.LIST_ITEM}`)
    }

    if (child.type === NodeTypes.TEXT) {
      console.log(`insert: ${NodeTypes.TEXT}`)
      console.log(textCache)
      if (textCache.color) {
        pdf.fillColor(textCache.color)
      }
      pdf.text(textCache.value)
      pdf.fillColor('black')

      textCache = {
        value: '',
        color: undefined
      }
    }
  },

  remove: child => {
    console.log('remove')
  },

  createElement: (tag: NodeTypes): any => {
    if (tag === NodeTypes.TEXT) {
      return {
        type: NodeTypes.TEXT
      }
    }

    if (tag === NodeTypes.LIST) {
      return {
        type: NodeTypes.LIST,
      }
    }

    if (tag === NodeTypes.LIST_ITEM) {
      return {
        type: NodeTypes.LIST_ITEM,
      }
    }

    throw Error(`Unknown tag type: ${tag}`)
  },

  createText: text => {
    textCache.value = text
    console.log(`createText: ${text}`)
  },

  createComment: text => {
    console.log('createComment')
  },

  setText: (node, text) => {
    console.log('setText')
  },

  setElementText: (el, text) => {
    // listItemsCache.push(text)
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
}

const { render, createApp } = createRenderer(nodeOps)

const ListItem = defineComponent({
  name: 'ListItem',
  render() {
    return h(NodeTypes.LIST_ITEM, this.$slots.default)
  }
})

const List = defineComponent({
  name: 'List',
  render() {
    if (!this.$slots.default) {
      return []
    }

    const items = this.$slots.default()
      .filter(x => x.type === ListItem)
      // @ts-ignore
      .map(x => h(NodeTypes.LIST_ITEM, x.children))

    return h(NodeTypes.LIST, items)
  }
})

const Text = defineComponent({
  name: 'Text',
  render() {
    if (!this.$slots.default) {
      return
    }
    if (this.$attrs.color) {
      console.log('Setting to red')
      textCache.color = this.$attrs.color as string | undefined
    }
    return h(NodeTypes.TEXT, this.$props, this.$slots.default())
  }
})

const App = defineComponent({
  name: 'App',
  components: { Text, List, ListItem },
  render: compile(`
    <Text color='red'>Title!</Text>
    <List color='blue' underline>
      <ListItem>
        <Text text='List Item 1' />
      </ListItem>
      <ListItem>
        <Text text='List Item 2' />
      </ListItem>
    </List>
  `)
  // render() {
  //   return [
  //     h(Text, { color: 'red' }, () => 'This is the title'),
  //     h(List, () => [
  //       h(ListItem, 'A'),
  //       h(ListItem, 'B')
  //     ])
  //   ]
  // }
})


const pdf = new PDFDocument()
const app = createApp(App)
app.mount(pdf)

pdf
  .pipe(fs.createWriteStream('./file.pdf'))
  .on('finish', function () {
    console.log('PDF closed');
  })

// Close PDF and write file.
pdf.end()