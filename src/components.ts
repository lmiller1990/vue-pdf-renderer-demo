import { defineComponent, h } from 'vue'
import { Tag } from './elements'

const createPDFComponent = (tag: Tag) =>
  defineComponent({
    inheritAttrs: false,
    name: tag,
    render() {
      return h(tag, this.$attrs, this.$slots?.default?.() || [])
    }
  })

export const View = createPDFComponent('View')
export const Text = createPDFComponent('Text')
export const Document = createPDFComponent('Document')
