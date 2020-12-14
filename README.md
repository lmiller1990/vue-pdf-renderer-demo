This is a demo on how to build a customer renderer for Vue.js 3. This one renders to a PDF using PDFKit. 

This is not for production use, but to demonstrate how you could create a non-standard custom renderer.

See [the blog post](https://lachlan-millerme/articles/vue-3-pdf-customer-renderer) for a write-up on how to write a custom renderer, or the [article here](./ARTICLE.md).

`master` may not be in a working state; I am just hacking on this when I have time. You can find out by installing the deps with `yarn` then run `yarn ts-node src` to generate the PDF, then `open file.pdf` to see the output.

Currently this:

```html
<View>
  <View :styles="{color: 'red'}">
    <Text :styles="{color: 'blue'}">Blue</Text>
    <Text>Red</Text>
    <Text :styles="{color: 'green'}">Green</Text>
  </View>
  <Text>Default</Text>
  <Text :styles="{color: 'yellow'}">Yellow</Text>
</View>
```

![](./screenshots/SS-final.png)
