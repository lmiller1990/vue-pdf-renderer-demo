import PDFDocument from 'pdfkit'
import fs from 'fs'
import { createRenderer, RendererOptions, h, defineComponent, computed } from '@vue/runtime-core'
import { createNodeOps } from '.'
import { View, ViewWrapper, Text } from './components'
import { compile } from 'vue'

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
        h(Text, {}, () => 'foo')
      ]
    )
  }
})

const AppTemplate = defineComponent({
  ...common,
  name: 'AppTemplate',
  render: compile(`
    <View :styles="{color: 'red'}">
      <Text>Foo</Text>
    </View>
  `)
})


const renderFn = () => {
  const pdf = new PDFDocument()
  const nodeOps = createNodeOps(pdf)
  const { createApp } = createRenderer(nodeOps)

  const app = createApp(AppRenderFn)
  app.mount(pdf)

  pdf
    .pipe(fs.createWriteStream('./file.pdf'))
    .on('finish', function () {
      console.log('PDF closed');
    })

  // Close PDF and write file.
  pdf.end()
}

const renderTemplate = () => {
  const pdf = new PDFDocument()
  const nodeOps = createNodeOps(pdf)
  const { createApp } = createRenderer(nodeOps)

  const app = createApp(AppTemplate)
  app.mount(pdf)

  pdf
    .pipe(fs.createWriteStream('./file.pdf'))
    .on('finish', function () {
      console.log('PDF closed');
    })

  // Close PDF and write file.
  pdf.end()
}

// renderFn()
renderTemplate()