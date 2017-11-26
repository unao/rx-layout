import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { tap } from 'rxjs/operators/tap'
import { filter } from 'rxjs/operators/filter'
import { merge } from 'rxjs/operators/merge'
import { switchMap } from 'rxjs/operators/switchMap'
import { map } from 'rxjs/operators/map'
import { debounceTime } from 'rxjs/operators/debounceTime'
import { withLatestFrom } from 'rxjs/operators/withLatestFrom'
import { share } from 'rxjs/operators/share'
import 'rxjs/add/observable/combineLatest'

import {
  Box, Params, Streamify, ToBoolean, DimensionsSettable, Dimensions, InsertBox,
  Gutters, Gutter, NumberOrGutterPartial,
  Size, SizeOuter, SizeInner, Position
} from './box.types'

import { properGutter } from './box-helpers'

const SETTEABLE_NUMBER_VALUE_NAMES: Array<keyof Dimensions & (keyof Position | keyof SizeOuter)> = [
  'x', 'y', 'widthOuter', 'heightOuter'
]

const GETTABLE_NUMBER_VALUE_NAMES: Array<keyof Dimensions & (keyof SizeInner)> = [
  'widthInner', 'heightInner'
]

const GUTTER_VALUE_NAMES: Array<keyof Dimensions & (keyof Gutters)> = [
  'padding', 'margin'
]

export const defaultInner = (defaultNumber: number) => (boxes: Array<Readonly<DimensionsSettable>>): Size => {
  const { xMin, xMax, yMin, yMax } = boxes.reduce((acc, b) => ({
    xMin: b.x < acc.xMin ? b.x : acc.xMin,
    yMin: b.y < acc.yMin ? b.y : acc.yMin,
    xMax: (b.x + b.widthOuter + b.margin.right) > acc.xMax ? + (b.x + b.widthOuter + b.margin.right) : acc.xMax,
    yMax: (b.y + b.heightOuter + b.margin.bottom) > acc.yMax ? (b.y + b.heightOuter + b.margin.bottom) : acc.yMax
  }), { xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity })
  return {
    width: (xMin === Infinity || xMax === Infinity) ? defaultNumber : xMax - xMin,
    height: (yMin === Infinity || yMax === Infinity) ? defaultNumber : yMax - yMin
  }
}

export interface LayoutFn<I> {
  (box: Readonly<DimensionsSettable>, boxes: Array<Readonly<DimensionsSettable & { info: I }>>): {
    // if absent default will be calculated by default mechanism
    inner?: Size
    // the length of updates MUST match the length of boxes
    updates: Array<Readonly<DimensionsSettable>>
  }
}

export interface CustomConfigOptionals {
  infoRequired: boolean
  defaultNumber: number
  // debounceChangesMs: number,
  bindOuterToInner: boolean | ToBoolean<Size>
}
export interface CustomConfig<I = undefined> extends Partial<CustomConfigOptionals> {
  layout: LayoutFn<I>
}

const handleBehaviorAndStream = <V>(box: Box<any, any>, settable: boolean, propName: string, [behavior, stream]: [BehaviorSubject<V>, Observable<V>]) => {
  if (settable) { (box.$ as any)[propName] = stream }
  if (settable) {
    Object.defineProperty(box, propName, {
      enumerable: true, configurable: true,
      get: () => behavior.value,
      set: v => v !== behavior.value && behavior.next(v)
    })
  } else {
    Object.defineProperty(box, propName, {
      enumerable: true, configurable: true,
      get: () => behavior.value
    })
  }
  return behavior
}

const paramValueToBehaviorAndStream = <In, Out>(value: In | Observable<Out> | BehaviorSubject<Out> | undefined, defaultIn: In, transformFn: ((i: In) => Out)):
  [BehaviorSubject<Out>, Observable<Out>] => {
  if (value instanceof BehaviorSubject) {
    return [value, value.asObservable()]
  } else if (value instanceof Observable) {
    const behavior = new BehaviorSubject<Out>(transformFn(defaultIn))
    return [behavior, value.pipe(
      tap(n => behavior.next(n)),
      filter(x => false),
      merge(behavior)
    )]
  } else {
    const behavior = new BehaviorSubject<Out>(transformFn(value || defaultIn))
    return [behavior, behavior.asObservable()]
  }
}

const interpretOptional = (c: CustomConfig): CustomConfigOptionals => ({
  infoRequired: !!c.infoRequired,
  defaultNumber: c.defaultNumber !== undefined ? c.defaultNumber : 0,
  bindOuterToInner: Object.assign({ width: false, height: false }, c.bindOuterToInner && { width: true, height: true })
  // debounceChangesMs: c.debounceChangesMs || 0
})

const insertBoxRaw = <ChildInfo>(parent: Box<ChildInfo, any>, boxesBehavior: BehaviorSubject<Array<Box<ChildInfo, any>>>): InsertBox<ChildInfo> =>
  (newBox, where) => {
    const boxes = parent.boxes
    if (boxes.indexOf(newBox) > -1) {
      return false
    }

    let insertAt
    if (where === undefined) {
      insertAt = boxes.length
    } else if (typeof where === 'number') {
      if (!(where >= 0 && where <= boxes.length)) {
        return false
      }
      insertAt = where
    } else {
      const { box, position } = where
      const bIndex = boxes.indexOf(box)
      if (bIndex === -1) {
        return false
      }
      insertAt = bIndex + position
    }

    if (newBox.parent) {
      newBox.parent.removeBox(newBox)
    }
    (newBox as any).parent = parent
    boxes.splice(insertAt, 0, newBox)
    boxesBehavior.next(boxes)
    return true
  }

export const customLayoutFactory = <ChildInfo = any, Info = undefined>(config: CustomConfig) =>
  (p: Params & { info?: Info } = {}): Box<ChildInfo, Info> => {
    const cfg = interpretOptional(config)
    const { defaultNumber, infoRequired } = cfg
    const bindOuterToInner = cfg.bindOuterToInner as ToBoolean<Size>

    if (infoRequired && p.info === undefined) {
      throw new Error('Missing "info".')
    }

    const boxesBehavior = new BehaviorSubject<Array<Box<ChildInfo, any>>>([])

    // the construction follows Box interface
    // it is done in a dynamic way so type safety is only approximated
    const boxBase = {}
    const box = Object.assign(
      boxBase as Dimensions,
      {
        $: ({} as Readonly<Streamify<Dimensions>>),
        info: (p.info as Info), // if infoRequired not true no guarantee
        get boxes () {
          return boxesBehavior.value.concat([])
        },
        boxes$: boxesBehavior.asObservable(),
        insertBox: insertBoxRaw(boxBase as Box<ChildInfo, any>, boxesBehavior),
        removeBox: (b: Box<any, ChildInfo> | number) => {
          const bs = (boxBase as Box<any, any>).boxes
          const idx = typeof b === 'number' ? b : bs.indexOf(b)
          if (idx === -1) return false
          bs.splice(idx, 1)
          delete (boxBase as any).parent
          boxesBehavior.next(bs)
          return true
        }
      })

    SETTEABLE_NUMBER_VALUE_NAMES.forEach(prop =>
      handleBehaviorAndStream<number>(box, true, prop,
        paramValueToBehaviorAndStream<number, number>(p[prop], defaultNumber, x => x)))

    GUTTER_VALUE_NAMES.forEach(prop => handleBehaviorAndStream<Gutter>(box, true, prop,
      paramValueToBehaviorAndStream<NumberOrGutterPartial, Gutter>(p[prop], 0, properGutter)))

    const [widthInnerBehavior, heightInnerBehavior] = GETTABLE_NUMBER_VALUE_NAMES.map(prop =>
      handleBehaviorAndStream<number>(box, false, prop,
        paramValueToBehaviorAndStream<number, number>(defaultNumber, defaultNumber, x => x)))

    const innerSize = boxesBehavior.pipe(
      tap((bs) => console.log('BOXES', bs)),
      switchMap(boxes =>
        Observable.combineLatest(...boxes
          .map(b =>
            Observable.combineLatest(b.$.widthOuter, b.$.heightOuter)
          )
        ).pipe(
          merge(Observable.combineLatest(box.$.widthOuter, box.$.heightOuter)),
          debounceTime(0),
          map(() => config.layout(box, boxes)),
          tap(x => console.log('UPDATES', Date.now(), x)),
          tap(x => {
            x.updates.forEach((u, idx) => Object.assign(boxes[idx], u))
            const inner = x.inner || defaultInner(defaultNumber)(boxes)
            widthInnerBehavior.next(inner.width)
            heightInnerBehavior.next(inner.height)
          }),
          filter(() => false)
          )
      ),
      share()
    );

    (box as any).$.widthInner = innerSize.pipe(merge(widthInnerBehavior));
    (box as any).$.heightInner = innerSize.pipe(merge(heightInnerBehavior))
    if (bindOuterToInner.width) {
      (box as any).$.widthOuter = (box as any).$.widthInner
      Object.defineProperty(box, 'widthOuter',
        {
          set: (x) => {
            throw new Error('Cannot set widthOuter, when bound to widthInner')
          }, get: () => widthInnerBehavior.value
        })
    }

    if (bindOuterToInner.height) {
      (box as any).$.heightOuter = (box as any).$.heightInner
      Object.defineProperty(box, 'heightOuter',
        {
          set: (x) => {
            throw new Error('Cannot set heightOuter, when bound to heightInner')
          }, get: () => heightInnerBehavior.value
        })
    }

    return box
  }
