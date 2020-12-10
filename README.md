Hacking on a prototype PDF renderer for Vue 3. This is not for production use, but to demonstrate how you could create a non-standard custom renderer for Vue 3.

`master` may not be in a wokring state; I am just hacking on this when I have time. You can find out by installing the deps with `yarn` then run `yarn ts-node index.ts` to generate the PDF, then `open file.pdf` to see if it worked.

Currently supported is:

```html
<Text color="red">This is a PDF</Text>
<List color="blue" underline>
  <ListItem>Foo</ListItem>
  <ListItem>Bar</ListItem>
</List>
```
