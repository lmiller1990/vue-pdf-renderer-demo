import { PDFRenderable, NodeMap } from './elements'

export type StyleRule = 
  'align' 
  | 'color' 
  | 'fontSize' 
  | 'marginBottom'
  | 'marginTop'

export const styleRules: StyleRule[] = ['align', 'color', 'fontSize', 'marginBottom', 'marginTop']

interface DefaultStyleSheet {
  align: 'left' | 'right' | 'center'
  color: string
  fontSize: number
  marginBottom: number
  marginTop: number
}

export type PDFStyleSheet = Partial<DefaultStyleSheet>

export const defaults: DefaultStyleSheet = {
  align: 'left',
  color: 'black',
  fontSize: 10,
  marginBottom: 0,
  marginTop: 0,
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
  if (node.styles[rule] !== undefined) {
    return node.styles[rule]
   } 

   return getStyleValue(rule, nodeMap[node.parent], nodeMap)
}
