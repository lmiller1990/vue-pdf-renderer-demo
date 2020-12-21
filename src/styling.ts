import { PDFRenderable, NodeMap } from './elements'

export type StyleRule = 'color' | 'fontSize'
export const styleRules: StyleRule[] = ['color', 'fontSize']

interface DefaultStyleSheet {
  color: string
  fontSize: number
}

export type PDFStyleSheet = Partial<DefaultStyleSheet>

export const defaults: DefaultStyleSheet = {
  color: 'black',
  fontSize: 14
}

interface DefaultStyleSheet {
  color: string
  fontSize: number
}

export function getStyleValue<T extends StyleRule>(
  rule: T, 
  node: PDFRenderable, 
  nodeMap: NodeMap
): Partial<DefaultStyleSheet>[T] {
  if (node.styles[rule]) {
    return node.styles[rule]
   } 

   return getStyleValue(rule, nodeMap[node.parent], nodeMap)
}
