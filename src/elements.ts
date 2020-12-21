// This is the most low level node.

import { defaults, PDFStyleSheet } from './styling'

// Eg Text is a PDFNode. PDFNode does not have children.
export class PDFNode {
  id: string = (Math.random() * 10000).toFixed(0)
  _parent: string | undefined
  styles: PDFStyleSheet = {} 

  public get parent(): string {
    if (!this._parent) {
      throw Error(`No parent found for node #${this.id}`)
    }

    return this._parent
  }
}

export class PDFTextNode extends PDFNode {
  value: string

  constructor(value: string) {
    super()
    this.value = value
  } 
}

export type Tag = 'View' | 'Document' | 'Text'

// PDFElement is the main class of Elements you will use.
// The difference between PDFNode and PDFElement is PDFElements can have children.
export class PDFElement extends PDFNode {
  children: string[] = []
  tag: Tag

  constructor(tag: Tag) {
    super()
    this.tag = tag
  }
}

export class PDFDocumentElement extends PDFElement {
  id = 'root'
  styles: PDFStyleSheet = {...defaults}
  filename: string

  constructor(tag: Tag, options: { filename: string }) {
    super(tag)
    this.filename = options.filename
  }
}

export class PDFTextElement extends PDFElement {}
export class PDFViewElement extends PDFElement {}

export type PDFRenderable = PDFTextNode 
  | PDFTextElement 
  | PDFViewElement
  | PDFDocumentElement

export type PDFNodes = PDFTextNode

export type PDFElements =
  PDFTextElement
  | PDFViewElement
  | PDFDocumentElement 

export type NodeMap = Record<string, PDFNodes | PDFElements>