import { NumberOrGutter, Gutter } from './box.types'

const defaultGutter = { top: 0, bottom: 0, left: 0, right: 0 }
export const properGutter = (s: NumberOrGutter): Gutter => {
  if (typeof s === 'number') {
    return {
      top: s, bottom: s, left: s, right: s
    }
  } else {
    return { ...defaultGutter, ...s }
  }
}
