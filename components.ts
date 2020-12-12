import { defineComponent, h } from 'vue'

export const Document = defineComponent({
  name: 'Document',
  inheritAttrs: false,
  render() {
    return this.$slots.default
  }
})

export const ViewWrapper = defineComponent({
  name: 'ViewWrapper',
  inheritAttrs: false,
  render() {
    return this.$slots.default
  }
})


export const View = defineComponent({
  name: 'View',
  inheritAttrs: false,
  render() {
    // console.log(this.$attrs)
    // @ts-ignore
    return h('View', this.$attrs, this.$slots.default())
  }
})

export const Text = defineComponent({
  name: 'Text',
  render() {
    // @ts-ignore
    return h('Text', this.$slots.default())
  }
})
