import { PDFRenderable, NodeMap } from './elements'

export type StyleRule = 
  'align' 
  | 'color' 
  | 'fontSize' 

export const styleRules: StyleRule[] = ['align', 'color', 'fontSize']

interface DefaultStyleSheet {
  align: 'left'
  color: string
  fontSize: number
}

export type PDFStyleSheet = Partial<DefaultStyleSheet>

export const defaults: DefaultStyleSheet = {
  align: 'left',
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
