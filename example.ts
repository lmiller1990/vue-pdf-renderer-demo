import PDFDocument from 'pdfkit'
import fs from 'fs'
import { createRenderer, RendererOptions, h, defineComponent, computed } from '@vue/runtime-core'
import { baseCompile } from '@vue/compiler-core'
import { compile } from 'vue'
import { createNodeOps } from '.'
import { View, ViewWrapper, Text } from './components'

const App = defineComponent({
  name: 'App',
  components: { Text, View },
  data() {
    return {
      styles: {
        color: 'blue'
      }
    }
  },
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


const pdf = new PDFDocument()
const nodeOps = createNodeOps(pdf)
const { createApp } = createRenderer(nodeOps)

const app = createApp(App)
app.mount(pdf)

pdf
  .pipe(fs.createWriteStream('./file.pdf'))
  .on('finish', function () {
    console.log('PDF closed');
  })

// Close PDF and write file.
pdf.end()