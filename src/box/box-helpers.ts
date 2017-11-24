import { NumberOrGutterPartial, Gutter } from './box.types'
import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

const defaultGutter = { top: 0, bottom: 0, left: 0, right: 0 }
export const properGutter = (s: NumberOrGutterPartial): Gutter => {
  if (typeof s === 'number') {
    return {
      top: s, bottom: s, left: s, right: s
    }
  } else {
    return { ...defaultGutter, ...s }
  }
}
