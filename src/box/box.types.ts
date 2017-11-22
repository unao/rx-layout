import { Observable, BehaviorSubject } from 'rxjs'

export type ValueStreamOrBehavior<T> = {
  [P in keyof T]: T[P] | Observable<T[P]> | BehaviorSubject<T[P]>
}

export type Streamify<T> = {
  [P in keyof T]: Observable<T[P]>
}

export interface Gutter {
  top: number,
  bottom: number
  left: number,
  right: number
}
export type GutterPartial = Partial<Gutter>
export type NumberOrGutter = number | GutterPartial

export interface DimensionsBase {
  x: number
  y: number
  widthOuter: number
  heightOuter: number
  margin: Gutter
  padding: Gutter
}

export interface Dimensions extends DimensionsBase {
  readonly widthInner: number,
  readonly heightInner: number
}

export type DimensionsBasePartial = Partial<DimensionsBase>

export interface Params extends Partial<ValueStreamOrBehavior<DimensionsBase>> {}

export interface Box<ChildInfo, Info> extends Dimensions {
  readonly $: Readonly<Streamify<Dimensions>>
  info: Info

  readonly parent?: Box<any, any>,
  readonly boxes: Box<ChildInfo, any>[]
  readonly boxes$: Observable<Box<ChildInfo, any>[]>

  addBox (b: Box<ChildInfo, any>): boolean
  removeBox (b: Box<ChildInfo, any>): boolean
}
