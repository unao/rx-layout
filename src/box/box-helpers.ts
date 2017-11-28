import { NumberOrGutterPartial, Gutter, Dimensions, Box } from './box.types'
import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { debounceTime } from 'rxjs/operators/debounceTime'
import 'rxjs/add/observable/merge'

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

const propsObject = <T, K extends keyof T>(obj: T, ...keys: K[]) =>
  keys.reduce((acc, c) => {
    acc[c] = obj[c]
    return acc
  }, ({} as { [P in K ]: T[P] }))

const propsArray = <T, K extends keyof T>(obj: T, ...keys: K[]) =>
  keys.map(k => obj[k])

export const observeBox = <ChildInfo, Info>(box: Box<ChildInfo, Info>, ...keys: Array<keyof Dimensions>) =>
    Observable.merge(...propsArray(box.$, ...(keys.length ? keys : Object.keys(box.$) as any)))
      .pipe(
        debounceTime(0)
      )
