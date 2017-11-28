import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

export type ValueStreamOrBehavior<T> = {
  [P in keyof T]: T[P] | Observable<T[P]> | BehaviorSubject<T[P]>
}

export type Streamify<T> = {
  [P in keyof T]: Observable<T[P]>
}

export type ToBoolean<T> = {
  [P in keyof T]: boolean
}

export interface Gutter {
  top: number,
  bottom: number
  left: number,
  right: number
}

export type NumberOrGutterPartial = number | Partial<Gutter>

export interface Position {
  x: number,
  y: number
}

export interface Size {
  width: number,
  height: number
}

export interface SizeOuter {
  widthOuter: number,
  heightOuter: number
}

export interface SizeInner {
  readonly widthInner: number,
  readonly heightInner: number
}

export interface Gutters {
  margin: Gutter
  padding: Gutter
}

export interface DimensionsSettable extends Position, SizeOuter, Gutters { }

export interface Dimensions extends DimensionsSettable, SizeInner { }

export type DimensionsBasePartial = Partial<DimensionsSettable>

export interface Params extends Partial<ValueStreamOrBehavior<DimensionsSettable>> { }

export enum InsertPosition {
  Before = 0,
  After = 1
}

export interface InsertBox<ChildInfo> {
  (box: Box<any, ChildInfo>, where?: {
    box: Box<any, ChildInfo>,
    position: InsertPosition
  }): boolean
}

export interface Box<ChildInfo, Info> extends Dimensions {
  readonly $: Readonly<Streamify<Dimensions>>
  info: Info

  readonly parent?: Box<any, any>,
  readonly boxes: Box<ChildInfo, any>[]
  readonly boxes$: Observable<Box<ChildInfo, any>[]>

  insertBox: InsertBox<ChildInfo>
  removeBox (box: Box<any, ChildInfo> | number): boolean
}
