import { defineComponent, h } from 'vue'

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
    return h('View', this.$attrs, this.$slots.default)
  }
})

export const Text = defineComponent({
  name: 'Text',
  render() {
    // @ts-ignore
    return h('Text', this.$slots.default())
  }
})
