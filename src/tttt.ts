type StyleRule = 'color' | 'fontSize'

interface DefaultStyleSheet {
  color: string
  fontSize: number
}

export type PDFStyleSheet = Partial<DefaultStyleSheet>

const defaults: DefaultStyleSheet = {
  color: 'black',
  fontSize: 14
} as const

class Node {
  styles: PDFStyleSheet

  constructor(styles: PDFStyleSheet) {
    this.styles = styles
  }
}

const node = new Node({ color: 'red' })


function getStyleValue<T extends StyleRule>(
  rule: T,
  node: Node,
) {
  if (rule in node.styles && node.styles[rule] !== undefined) {
    return node.styles[rule]
  }

  if (rule in defaults && defaults[rule] !== undefined) {
    // return defaults[rule]
  }

  throw Error(`You forgot to declare a default for ${rule} in defaults.`)
}

// Infer c is a string
// why is return type string | number | undefined? I want it to infer c is a string.
const s = getStyleValue('color', node)
const n = getStyleValue('fontSize', node)
