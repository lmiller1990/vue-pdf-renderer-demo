## Writing a Custom Renderer - Vue.js 3

Among many other cool features, Vue.js 3 is much more modular than Vue.js 3. The project is consists of [many different packages](https://github.com/vuejs/vue-next), making it even more flexible and customizable.

One of the more interesting architectural changes is the decoupled renderer and runtime. This makes it much easier to build custom renderers.

## What is a Custom Renderer?

Vue consists of several "systems". There is the reactivity system, it's custom component system, a virtual DOM, and several others. A renderer is what takes the output of the virtual DOM and *renders* it using some UI layer. [The DOM renderer](https://github.com/vuejs/vue-next/tree/master/packages/runtime-dom) (the only one that ships with Vue) could be considered only official renderer, and as such, the reference renderer. 

So, a custom renderer is renderer that targets anything other than the DOM.

The official DOM renderer can also be considered the best resource to learn to build a custom renderer - if you want to write one, you will become very well acquainted with it, since there are not many other resources on building a Vue 3 renderer.

## Existing Literature

The main resources I used when preparing this post were:

- [Vuminal](https://github.com/ycmjason/vuminal). A terminal renderer. It's source code is overly modular and kind of difficult to navigate, and I couldn't get it to do anything much more than the basic counter example in the README.
- [Vugel](https://github.com/Planning-nl/vugel), a WebGL renderer.
- [Vue 3 DOM Renderer source](https://github.com/vuejs/vue-next/tree/master/packages/runtime-dom). This was the most useful resource by far.
- [React PDF](https://react-pdf.org/). This is a custom PDF renderer for React. Not Vue, but the ideas apply, and the inspiration for this project.

## What Are We Building?

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

<p align="center">
![](https://raw.githubusercontent.com/lmiller1990/vue-pdf-renderer-demo/article/screenshots/SS-final.png)
</p>

I will be using [PDFKit](https://pdfkit.org/) to produce the PDF. This is just an *example* - a fully featured PDF Renderer would be much more complex.

Let's get started!

## Anatomy of a Custom Renderer

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

`createRenderer` takes one argument, an object of options. These are called *node ops*, short for *node operations*. Operations Vue can perform on nodes. This basically means CRUD actions (create, read, update, delete) and a few more. A full list including types can be found [in the Vue source code](https://github.com/vuejs/vue-next/blob/master/packages/runtime-dom/src/nodeOps.ts). It's pretty important to understand what they all do. Here a list of all the node ops.

```ts
const nodeOps = {
  patchProp(...args): void;
  forcePatchProp?(...args): boolean;
  insert(...args): void;
  remove(...args): void;
  createElement(...args): HostElement;
  createText(...args): HostNode;
  createComment(...args): HostNode;
  setText(...args): void;
  setElementText(...args): void;
  parentNode(...args): HostElement | null;
  nextSibling(...args): HostNode | null;
  querySelector?(...args): HostElement | null;
  setScopeId?(...args): void;
  cloneNode?(...args): HostNode;
  insertStaticContent?(...args): HostElement[];
}
```

We are only interested in a subset of node ops. The reason is our PDF renderer will be *static* - no dynamic, real time updates. For this reason we have little need for things like `querySelector` or `remove` - since nodes are not moving around or otherwise dynamically changing, we won't be needing these. We also don't need things like `createComment` - PDFs don't have comments.

To figure out which node ops we need to implement, I'll just start writing the renderer, and filling them out as they get called.

## Creating the Renderer

Time to write some code. We start by calling `createRenderer`, and passing in the node ops. For now I am just going to `console.log` the relevant values to illustrate how and when the different operations are called.


```ts
import { RendererOptions } from 'vue'

class PDFNode {
  id: string = (Math.random() * 10000).toFixed(0)
}

function noop(fn: string): any {
  throw Error(`no-op: ${fn}`)
}

export const nodeOps: RendererOptions<any, any> = {
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
```

I declared the "host node" *and* "host element" by passing `<any, any>` as the first second generic parameters to the `createRenderer` function. In a DOM renderer, the host node is `Node` and the host element is `Element`. I am not differentiating between the two here, yet, but I will later on. I will also improve the type defintions later on.

I made all the node ops that are not be used for this simple example throw an error. I figured out which node ops I would need by experimentation.

Let's try it out!

```ts
import { 
  RendererOptions, 
  createRenderer, 
  defineComponent, 
  compile 
} from 'vue'

// ... 

const App = defineComponent({
  render: compile(`
    <Text>This is some text</Text>
  `)
})

const root = {}

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

We have not created a `<Text>` element yet, so we get a warning. Then three node ops are executed:

```
createElement: Text
createText: This is some text
insert { parent: undefined, child: 'This is some text' }
```

Makes sense. Vue creates the `<Text>` element, then the inner text, then calls the `insert` node op to try and insert it. We then get an error that a `__vnode` property cannot be defined on an `el`.

## Defining Node Types

The problem is our `createElement` and `createText` node ops are not returning any nodes - they should be creating and returning new nodes, as the names suggest.

We should make those node ops return the correct elements. I'll also improve the types.

```ts
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

class PDFElement extends PDFNode {}

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

export const nodeOps: RendererOptions<PDFNodes, PDFElements> = {
  // ...

  createElement: (tag: 'Text' | 'Document' | 'View') => {
    console.log(`createElement: ${tag}`)
    if (tag === 'Text') {
      return new PDFTextElement()
    }

    throw Error(`Unsupported tag ${tag}`)
  },

  createText: (text: string) => {
    return new PDFTextNode(text)
  },

  // ...
}

const { createApp } = createRenderer<PDFTextNode, PDFElements>(nodeOps)

const App = defineComponent({
  render: compile(`
    <Text>This is some text</Text>
  `)
})

const root = new PDFDocumentElement()

const { createApp } = createRenderer<PDFNode, PDFElements>(nodeOps)
const app = createApp(App).mount(root)
```

Unlike a DOM renderer, where all the build in node types have already been defined by a the DOM specification, there is no such thing for PDFs. I decided to define my own node types to model a PDF. 

I also added `parent` and `children` keys to some of the nodes and elements. You will see why soon.

Running this now works a whole lot better:

```
[Vue warn]: Failed to resolve component: Text
  at <App>
createElement: Text
insert {
  parent: PDFTextElement { id: '831', children: [] },
  child: PDFTextNode { id: '9528', value: 'This is some text' }
}
insert {
  parent: PDFDocumentElement { id: '9992', children: [] },
  child: PDFTextElement { id: '831', children: [] }
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

Update `insert`:

```ts
const nodeMap: Record<string, PDFNodes | PDFElements> = {}

export const nodeOps: RendererOptions<PDFNodes, PDFElements> = {
  // ...
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

  // ...
}
```

I added a few things:


- `const nodeMap: Record<string, PDFTextNode | PDFTextElement> = {}`. This is to keep track of the nodes - it turns out it'll be useful to have our own cache of the nodes for later.
- `nodeMap['root']` to easily access the top level `PDFDocumentElement` node.
- Assigning values to `parent` and `children`. I am keeping track of these by the `id`, not a reference to the actual node. We can easily get the node from the `nodeMap` when we need it.

`nodeMap` looks like this:

```json
{
  '325': PDFTextNode { 
    id: '325', 
    value: 'This is some text' 
  },
  '6805': PDFTextElement { 
    id: '6805', 
    children: [ '325' ] 
  },
  root: PDFDocumentElement { 
    id: '8306', 
    children: [ '6805' ] 
  }
}
```

## Creating a Custom Tree Structure

You may have noticed we are more or less extracting our own tree structure from the node ops as they are executed. An alternative would be to use Vue's own internal virtual DOM, which can be accessed like this:

```js
const { createApp } = createRenderer(nodeOps)
const app = createApp(App)
app.mount(root).$.subTree //=> access virtual DOM
```

It turns out this isn't too practical, primarily because Vue's virtual DOM is *much* more noisy and complex than what we need for this simple example. You could consider using that, though, and it would be required if you were building any kind of real-time renderer than relies on reactivity. In this example I am building a *static* renderer, so we don't have any need for reactivity or any of the other features Vue's virtual DOM supports.

For this reason I decided to create my own simple node cache (the `nodeMap` object) which is seeded by the initial virtual DOM render. We still get the power of Vue's directives, like `v-for` and v-if`, as well as the ability tocreate a PDF using Vue's declarative template system, as we will see soon!

## Custom Components

The console still has the warnings about `<Text>` and `<View>` components not existing. Let's make those.

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

We are not really using Vue's component system heavily in this example, nor the the virtual DOM, so the components don't do a whole lot - basically just render their children and forward the attributes, like `styles`, which we will implement soon. I might like to add more complex, featureful components in the future though, so we should keep this in mind as we build.

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
const draw = (node: PDFRenderable) => {
  // ...
}

const traverse = (node: PDFRenderable) => {
  if (node instanceof PDFElement) {

    for (const child of node.children) {
      draw(nodeMap[child])
      traverse(nodeMap[child])
    }
  }
}
```

`PDFRenderable` represents any node in our tree - both `PDFNodes` and the more complex `PDFElements`, which includes `PDFDocumentElement` and `PDFViewElement` at the moment. 

`PDFTextNode` never has children - but `PDFElement` does. If we are traversing a `PDFElement`, we want to traverse all of the children, too. `draw` will handle interfacing with PDFKit.

Now add `draw`:

```ts
const draw = (node: PDFRenderable) => {
  if (node instanceof PDFTextNode) {
    pdf.text(node.value)
  }
}
```

Finally, write the PDF to the filesystem using `fs`

```ts
import PDFDocument from 'pdfkit'
import fs from 'fs'

const pdf = new PDFDocument()
const stream = pdf.pipe(fs.createWriteStream('./goal.pdf'))

// ... 

const rootNode = nodeMap['root']
traverse(rootNode)

pdf.end()
stream.on('finish', () => {
  console.log('Wrote to file.pdf.')
})
```

Finally, we have a PDF!

<p align="center">
![](https://raw.githubusercontent.com/lmiller1990/vue-pdf-renderer-demo/article/screenshots/SS-2.png)
</p>

Now we get to have some fun and add *styles*.

## Adding Styles

I have decided all styles should be defined in a `styles` attribute. I have decided to only support a limited subset of CSS, much like react-native and [`react-pdf`](https://react-pdf.org/styling#valid-css-properties).

Update the example:

```ts {4,6}
const App = defineComponent({
  components: { Text, View },
  render: compile(`
    <View :styles="{color: 'red'}">
      <Text>This is some text</Text>
    </View>
  `)
})
```

Also, update `createElement` to support `<View>`:

```ts {3,9-11}
export const nodeOps: RendererOptions<PDFNodes, PDFElements> = {
  // ...
  createElement: (tag: 'Text' | 'Document' | 'View') => {
    console.log(`createElement: ${tag}`)
    if (tag === 'Text') {
      return new PDFTextElement()
    }

    if (tag === 'View') {
      return new PDFViewElement()
    }

    throw Error(`Unknown tag ${tag}`)
  },
}
```

Running this shows the `patchProp` node op is now called!

```sh {11-16}
createElement: View
createElement: Text
insert {
  parent: PDFTextElement { id: '2358', children: [] },
  child: PDFTextNode { id: '9202', value: 'This is some text' }
}
insert {
  parent: PDFViewElement { id: '5973', children: [] },
  child: PDFTextElement { id: '2358', children: [ '9202' ] }
}
patchProp {
  el: PDFViewElement { id: '5973', children: [ '2358' ] },
  key: 'styles',
  prevVal: null,
  nextVal: { color: 'red' }
}
insert {
  parent: PDFDocumentElement { id: '7005', children: [] },
  child: PDFViewElement { id: '5973', children: [ '2358' ] }
}
```

`patchProp` applies updates to attributes - this can include `class`, `style`, or any other attribute, including custom attributes. We need to grab `styles` and store it somewhere. We want `key` and `nextVal` in this case. We also need to update `PDFElement` to have a `styles` property.

```ts {2,11-15}
class PDFElement extends PDFNode {
  styles: Record<string, string> = {}
}

// ...

export const nodeOps: RendererOptions<PDFNodes, PDFElements> = {
  // ...

  patchProp: (el, key, prevVal, nextVal: Record<string, any>) => {
    if (nextVal && key === 'styles') {
      for (const [attr, value] of Object.entries(nextVal)) {
        el.styles[attr] = value
      }
    }
  },

  // ...
}
```

Now update `draw` to apply the style.

```ts {2-6}
const draw = (node: PDFRenderable) => {
  if (node instanceof PDFElement) {
    if (node.styles.color) {
      pdf.fill(node.styles.color)
    }
  }

  if (node instanceof PDFTextNode) {
    pdf.text(node.value)
  }
}
```

Now we have red text:

<p align="center">
![](https://raw.githubusercontent.com/lmiller1990/vue-pdf-renderer-demo/article/screenshots/SS-3.png)
</p>

## Supporting Default Styles

We have cascading styles - anything nested under a `<View>` with `{color: 'red'}` will be red. The way PDFKit works is not exactly what we want, though - once you do `pdf.fill('red')`, everything will be red until you change the color to something else. What we want to do is mimic a browser - to figure out the correct color, we should recurse up the tree until we find a parent with `:styles="{color: '...'}"`. If we don't, we should apply some default color. Black seems like the obvious choice.

This can be implememnted using a recursive `getParentStyle` function, and by setting some defaults:

```ts {1-20,23-30}
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
```

Let's make the example a bit more interesting. I will use `v-for`, to make sure everything works as it should:

```ts {3-7,9-18}
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
```

It works:

<p align="center">
![](https://raw.githubusercontent.com/lmiller1990/vue-pdf-renderer-demo/article/screenshots/SS-final.png)
</p>

## Conclusion
