## Writing a Custom Renderer - Vue.js 3

Among many other cool features, Vue.js is much more modular. The project is consists of many different [packages](https://github.com/vuejs/vue-next), making it even more flexible and customizable.

One of the more interesting architectural changes is the decoupled renderer and runtime. This makes it much easier to build custom renderers.

## What is a custom renderer?

A custom renderer is really just any renderer build on top of Vue's core compiler. [The DOM renderer](https://github.com/vuejs/vue-next/tree/master/packages/runtime-dom) (the only one that ships with Vue) could be considered a "custom renderer" in some ways - it doesn't have access to anything any other renderer would not have access to. 

This can also be considered the best resource to learn to build a custom renderer - if you want to write one, you will become very well aquainted with it, since there are not too many other resources on building a Vue 3 renderer.

## Existing Literature

The main resources I used when learning to do this and preparing this post were:

- [Vuminal](https://github.com/ycmjason/vuminal). A terminal renderer. It's source code is overly modular and kind of difficult to navigate, and I couldn't get it to do anything much more than the basic counter example in the README.
- [Vugel](https://github.com/Planning-nl/vugel), a WebGL renderer.
- [Vue 3 DOM Renderer source](https://github.com/vuejs/vue-next/tree/master/packages/runtime-dom). This was the most useful.
- [React PDF](https://react-pdf.org/). This is a custom PDF renderer for React. Not Vue, but the ideas apply.

## What are we building?

I decided to go with a *PDF renderer*. The goal is to take something like this:

```html
<template>
  <View>
    <View :styles="{color: 'red'}">
      <Text v-for="color in colors" :styles="{color}">
        {{ color }}
      </Text>
    </View>
    <Text>Default</Text>
    <Text :styles="{color: 'yellow'}">Yellow</Text>
  </View>
<template>

<script>
export default {
  data() {
    return {
      colors: ['red', 'blue', 'green']
    }
  }
}
</script>
```

And get this:

SS-1

I will be using [PDFKit](https://pdfkit.org/) to produce the PDF.

Let's get started!

## Anatomy of a custom renderer

The [runtime-core](https://github.com/vuejs/vue-next/tree/master/packages/runtime-core) gives us a hint and how to create a custom renderer:

```ts
import { createRenderer } from '@vue/runtime-core'

const { render, createApp } = createRenderer({
  patchProp,
  insert,
  remove,
  createElement,
  // ...
})
```

`createRenderer` takes an argument of options. These are called *nodeOps*, short for *node operations*. Things Vue can do on nodes. This basically means CRUD actions (create, read, update, delete) and a few more. A full list can be found in [in the Vue source code](https://github.com/vuejs/vue-next/blob/master/packages/runtime-dom/src/nodeOps.ts). It's pretty important to understand what they all do. Here a list with the types and arguments.

```ts
const nodeOps = {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any, isSVG?: boolean, prevChildren?: VNode<HostNode, HostElement>[], parentComponent?: ComponentInternalInstance | null, parentSuspense?: SuspenseBoundary | null, unmountChildren?: UnmountChildrenFn): void;
  forcePatchProp?(el: HostElement, key: string): boolean;
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void;
  remove(el: HostNode): void;
  createElement(type: string, isSVG?: boolean, isCustomizedBuiltIn?: string): HostElement;
  createText(text: string): HostNode;
  createComment(text: string): HostNode;
  setText(node: HostNode, text: string): void;
  setElementText(node: HostElement, text: string): void;
  parentNode(node: HostNode): HostElement | null;
  nextSibling(node: HostNode): HostNode | null;
  querySelector?(selector: string): HostElement | null;
  setScopeId?(el: HostElement, id: string): void;
  cloneNode?(node: HostNode): HostNode;
  insertStaticContent?(content: string, parent: HostElement, anchor: HostNode | null, isSVG: boolean): HostElement[];
}
```

We are only interested in a subset of nodeOps. The reason is our PDF renderer will be *static* - no dynamic, real time updates. For this reason we have little need for things like `querySelector` - since nodes are not moving around or otherwise dynamically changing, we don't have too much need for these. We also don't need things like `createComment` - PDFs don't have comments.

To figure out which nodeOps we need to implement, I'll just start writing the renderer, and filling them out as they get called.

## Creating the renderer

Time to write some code. We start by calling `createRenderer`, and passing in the nodeOps. For now I am just going to `console.log` the relevant values to illustrate how and when the different operations are called.

```ts
import { RendererOptions } from 'vue'

interface PDFNode {}

function noop(fn: string): any {
  throw Error(`no-op: ${fn}`)
}

export const nodeOps: RendererOptions<PDFNode, PDFNode> = {
  patchProp: (el, key, prevVal, nextVal) => {
    console.log('patchProp', { el, key, prevVal, nextVal })
  },

  insert: (child, parent, anchor) => {
    console.log('insert', { parent, child })
  },

  createElement: (tag): any => {
    console.log(`createElement: ${tag}`)
  },

  createText: text => {
    console.log(`createText: ${text}`)
    return text
  },

  parentNode: node => {
    console.log('parentNode')
    return null
  },

  createComment: (text) => {
    console.log(`createComment ${text}`)
    return text
  },

  setText: noop('setText'),
  setElementText: noop('setElementText'),
  nextSibling: noop('nextSibling'),
  querySelector: noop('querySelector'),
  setScopeId: noop('setScopeId'), 
  cloneNode: noop('cloneNode'),
  insertStaticContent: noop('insertStaticContent'),
  forcePatchProp: noop('forcePatchProp'),
  remove: noop('remove'),
}
```

I declared `PDFNode` as the "host node" *and* "host element" by passing `PDFNode` as the first second generic parameters to the `createRenderer` function. In a DOM renderer, the host node is `Node` and the host element is `Element`. I am not differentiating between the two here.

I made all the nodeOps that will not be used for this simple example throw an error if they are ever called (I figured out which nodeOps are and are not used by experimentation).

Let's try it out!

```ts
import { RendererOptions, createRenderer, defineComponent, compile } from 'vue'

const App = defineComponent({
  render: compile(`
    <Text>This is some text</Text>
  `)
})

const root: PDFNode = {}

const { createApp } = createRenderer(nodeOps)
const app = createApp(App).mount(root)
```

This is the output:

```
[Vue warn]: Failed to resolve component: Text
  at <App>
createElement: Text
createText: This is some text
insert { parent: undefined, child: 'This is some text' }

/Users/lachlan/code/dump/term-renderer/node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:3805
            Object.defineProperty(el, '__vnode', {
                   ^
TypeError: Object.defineProperty called on non-object
```

We have not created a `<Text>` element yet, so we get a warning. Then we see three nodeOps executing:

```
createElement: Text
createText: This is some text
insert { parent: undefined, child: 'This is some text' }
```

Makes sense. Vue creates the `<Text>` element, then the inner text, then calls the `insert` nodeOps to try and insert it. We then get an error that a `__vnode` property cannot be defined on an `el`.

## Defining Node Types

The problem is our `createElement` and `createText` nodeOps are not returning any nodes - they should be creating and returning new nodes, as the names suggest.

Let's take this opportunity to add some better types, too.

```ts
type PDFNodeType = 'RawText' | 'Text' | 'Document'

interface PDFNode {
  id: string
  type: PDFNodeType
}

interface PDFText extends PDFNode {
  type: 'RawText'
  value: string
}

export const nodeOps: RendererOptions<PDFNode, PDFNode> = {

  // ...

  createElement: (tag: PDFNodeType) => {
    console.log(`createElement: ${tag}`)
    return {
      type: tag,
      id: (Math.random() * 100000).toFixed(0)
    }
  },

  createText: (text: string): PDFText => {
    console.log(`createText: ${text}`)
    return {
      type: 'RawText',
      id: (Math.random() * 100000).toFixed(0),
      value: text 
    }
  },

  // ...
}

const App = defineComponent({
  render: compile(`
    <Text>This is some text</Text>
  `)
})

const root: PDFNode = {
  type: 'Document',
  id: (Math.random() * 100000).toFixed(0)
}
```

Unlike building a DOM renderer, where all the build in node types have already been defined by a specification, there is no such thing for PDFs, so we will just define our own node types to model a PDF. I also added an `id` to easily keep track of nodes.

Running this now works a whole lot better:

```
[Vue warn]: Failed to resolve component: Text
  at <App>
createElement: Text
createText: This is some text
insert {
  parent: { type: 'Text', id: '45165' },
  child: { type: 'RawText', id: '25002', value: 'This is some text' }
}
insert {
  parent: { type: 'Document', id: '73106' },
  child: { type: 'Text', id: '45165' }
}
```

This looks promising. The nodes are created and inserted (well, the `insert` node op is called) on the correct pair of nodes.

## Handling Insert

We don't have any way to track the parent-child relationship between the nodes. Looking at the [Vue DOM Renderer](https://github.com/vuejs/vue-next/blob/07559e5dd7e392c415d098f75ab4dee03065302e/packages/runtime-dom/src/nodeOps.ts#L12) we can see this is handled using `node.insertBefore`, which comes for free from the DOM. We will need something similar. This is because when it comes time to integrate PDFKit, we want to support styles in a cascading fashion. For example:

```html
<View :styles="{color: 'red'}">
  <View> 
    <Text>Text</Text>
  </View>
</View>
```

In this case, `Text` should be red - we need to know the parent, so we can recursively climb the tree to find the nearest parent node with a color attribute set. It will also be useful if we want to support something like the flex box model, where the child's layout depends on the parent.

Update `PDFNodeType` and `insert`:

```ts
interface PDFNode {
  id: string
  type: PDFNodeType
  parent?: string
  children: string[]
}

interface PDFText extends PDFNode {
  type: 'RawText'
  value: string
}

const nodeMap: Record<string, PDFNode> = {}

export const nodeOps: RendererOptions<PDFNode, PDFNode> = {
  // ...
  insert: (child, parent, anchor) => {
    console.log('insert', { parent, child })
    if (parent.type === 'Document') {
      nodeMap['root'] = parent
    }

    if (!(child.id in nodeMap)) {
      nodeMap[child.id] = child
    }

    parent.children.push(child.id)
    child.parent = parent.id
  },

  createElement: (tag: PDFNodeType) => {
    console.log(`createElement: ${tag}`)
    return {
      type: tag,
      id: (Math.random() * 100000).toFixed(0),
      children: []
    }
  },

  createText: (text: string): PDFText => {
    console.log(`createText: ${text}`)
    return {
      type: 'RawText',
      id: (Math.random() * 100000).toFixed(0),
      value: text,
      children: []
    }
  },
  // ...
}

const root: PDFNode = {
  type: 'Document',
  id: (Math.random() * 100000).toFixed(0),
  children: []
}

console.log(nodeMap)
```

I added a few things:

- `const nodeMap: Record<string, PDFNode> = {}`. This is to keep track of the nodes - it turns out it'll be useful to have our own cache of the nodes for later.
- `parent` and `children`. I typed them as `string`: instead of doing something like `children.push(child)` and `child.parent = parent`, saving the entire node, it's just as convinient to use the `id`. We can easily get the node from the `nodeMap` when we need it.

`nodeMap` looks like this:

```
{
  "9572": {
    "type": "RawText",
    "id": "9572",
    "value": "This is some text",
    "children": [],
    "parent": "18279"
  },
  "18279": {
    "type": "Text",
    "id": "18279",
    "children": [
      "9572"
    ],
    "parent": "33177"
  },
  "root": {
    "type": "Document",
    "id": "33177",
    "children": [
      "18279"
    ]
  }
}
```

## Creating a Custom Tree Structure?

You may have noticed we are more or less extracting our own tree structure from the node ops as they are executed. An alternative would be to use Vue's own internal VDOM, which can be accessed like this:

```js
const { createApp } = createRenderer(nodeOps)
const app = createApp(App)
app.mount(root).$.subTree //=> access VDOM
```

It turns out this isn't too practical, primarily because Vue's VDOM is *much* more noisy and complex than what we need for this simple example. You could consider using that, though, and it would be required if you were building any kind of real-time renderer than relies on reactivity. This is a *static* renderer, so we don't have any need for reactivity or any of the other features Vue's VDOM supports.

For this reason I decided to create my own simple node cache (the `nodeMap` object) which is seeded by the initial VDOM render. We still get the power of Vue's directives, like `v-for` and v-if`, as well as the ability to dynamically create a PDF using Vue's declarative template system.

## Custom Components

The console still has the warnings about `<Text>` and `<View>` components not existing.

```ts
import { h } from 'vue'

// ... 

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

const App = defineComponent({
  components: { Text, View },
  render: compile(`
    <Text>This is some text</Text>
  `)
})
```

We are not really using Vue's component system heavily in this example, not the VDOM heavily, so the components don't do a whole lot - basically just render their children and forward the attributes, like `styles`, which we will implement soon. I also created `<View>`, which we will use soon.

## Rendering a PDF

I am using [PDFKit](https://pdfkit.org/) to produce the PDF. It has an imperative API. To draw some red text, you would write:

```ts
import { PDFDocument } from 'pdfkit'

const pdf = new PDFDocument()
pdf
.fill('red')
.text('This is some text')
```

This means we need to somehow go from the `nodeMap` to this. The first step will be to traverse the nodes, and the second step will be drawing and text or styles.

Let's start with a `traverse` function:

```ts
```