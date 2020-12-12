import PDFDocument from 'pdfkit'
import fs from 'fs'
import { createRenderer, h, defineComponent } from '@vue/runtime-core'
import { compile } from 'vue'
import { View, Text } from './components'
import { createNodeOps, nodeMap, PDFNode } from '.'

const save = console.warn
console.warn = (msg: string) => {
  if (msg.includes('Non-function')) {
    return
  }
  save(msg)
}

const common = {
  components: { Text, View },
  data() {
    return {
      styles: {
        color: 'blue'
      }
    }
  }
}

const AppRenderFn = defineComponent({
  ...common,
  name: 'App',
  render() {
    return h(
      View,
      {},
      [
        h(View, 
          { styles: { color: 'red' } },
          [
            h(
              Text, 
              { styles: { color: 'blue' } },
              'Blue'
            ),
            h(
              Text, 
              {},
              'Red'
            ),
            h(
              Text, 
              { styles: { color: 'green' } },
              'Green'
            )
          ]
        ),
        h(Text, {}, 'default'),
        h(Text, { styles: { color: 'yellow' } }, 'Yellow')
      ]
    )
  }
})

const AppTemplate = defineComponent({
  ...common,
  name: 'AppTemplate',
  render: compile(`
    <View>
      <View :styles="{color: 'red'}">
        <Text :styles="{color: 'blue'}">Blue</Text>
        <Text>Red</Text>
        <Text :styles="{color: 'green'}">Green</Text>
      </View>
      <Text>Default</Text>
      <Text :styles="{color: 'yellow'}">Yellow</Text>
    </View>
  `)
})

const renderTemplate = () => {
  const ParentNode: PDFNode = {
    id: 'root',
    parent: undefined,
    type: 'Document',
    styles: {
      color: 'black'
    },
    children: [],
  }

  const pdf = new PDFDocument()
  pdf.pipe(fs.createWriteStream('./goal.pdf'))


  const nodeOps = createNodeOps()
  const { createApp } = createRenderer(nodeOps)

  const app = createApp(AppTemplate)
  // const app = createApp(AppRenderFn)
  app.mount(ParentNode)

  console.log(nodeMap)

  const getParentStyle = (attr: string, parent?: PDFNode): string => {
    if (!parent) {
      return defaults[attr]
    }

    return parent.styles[attr] 
      ? parent.styles[attr] 
      : getParentStyle(attr, parent.parent ? nodeMap[parent.parent] : undefined)
  }

  const defaults = {
    color: 'black'
  }

  const draw = (node: PDFNode) => {
    console.log(`Drawing for node ${node.type}`)
    if (node.styles.color) {
      console.log(node.styles.color)
      console.log(`Coloring: ${node.styles.color}`)
      pdf.fill(node.styles.color)
    } else {
      pdf.fill(getParentStyle('color', node.parent ? nodeMap[node.parent] : undefined))
    }

    if (node.value) {
      console.log(`Writing: ${node.value}`)
      pdf.text(node.value)
    }
  }

  const traverse = (node: PDFNode) => {
    if (!node.children) {
      return
    }

    for (const child of node.children) {
      draw(nodeMap[child])
      traverse(nodeMap[child])
    }
  }

  const root = nodeMap['root']
  traverse(root)
  pdf.end()

  console.log('pipe')
  pdf.on('finish', function () {
    console.log('PDF closed');
  })
}

renderTemplate()