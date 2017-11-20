import * as Rx from 'rxjs'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

export enum LayoutMechanism {
  Vertical = 'VERTICAL',
  Horizontal = 'HORIZONTAL'
}

export enum InsertPosition {
  Before = 0,
  After = 1
}

export enum SizeBinding {
  Manual = 'MANUAL',
  Inherit = 'INHERIT',
  ChildrenSum = 'CHILDREN_SUM',
  ChildMax = 'CHILD_MAX'
}

export interface LayoutValuesBase {
  x: number,
  y: number,
  width: number,
  height: number,
}

export interface LayoutValues extends LayoutValuesBase {
  position: { x: number, y: number },
  size: { width: number, height: number }
  readonly absX: number,
  readonly absY: number,
  // readonly innerWidth: number,
  // readonly innerHeight: number
}

export interface Streams {
  x: Rx.Observable<number>,
  y: Rx.Observable<number>,
  width: Rx.Observable<number>,
  height: Rx.Observable<number>,
  // innerWidth: Rx.Observable<number>,
  // innerHeight: Rx.Observable<number>,
  absX: Rx.Observable<number>,
  absY: Rx.Observable<number>,
  position: Rx.Observable<{ x: number, y: number }>,
  absPosition: Rx.Observable<{ x: number, y: number }>,
  size: Rx.Observable<{ width: number, height: number }>,
  all: Rx.Observable<LayoutValuesBase>
}

export interface BehaviorsBase {
  x: Rx.BehaviorSubject<number>,
  y: Rx.BehaviorSubject<number>,
  width: Rx.BehaviorSubject<number>,
  height: Rx.BehaviorSubject<number>,
}

export interface Behaviors extends BehaviorsBase {
  // innerWidth: Rx.BehaviorSubject<number>,
  // innerHeight: Rx.BehaviorSubject<number>
}

export interface Setters {
  setX: (x: number) => boolean,
  setY: (x: number) => boolean,
  setWidth: (width: number) => boolean,
  setHeight: (height: number) => boolean,
  setPosition: ({ x, y }: { x: number, y: number }) => boolean,
  setSize: ({ width, height }: { width: number, height: number }) => boolean
}

export interface IBox extends Setters, LayoutValues {
  $: Readonly<Streams>,
  remove: () => boolean,
  addBox: (cfg: IBoxConfig) => IBox,
  removeBox: (c: IBox) => boolean
}

export interface IBoxConfigRoot {
  layoutMechanism: LayoutMechanism,
  info?: any
  width?: number,
  height?: number
}

export interface IBoxConfig extends IBoxConfigRoot {
  widthBinding?: SizeBinding,
  heightBinding?: SizeBinding
  insertAt?: { box: IBox, where: InsertPosition } | number
}

export class Box implements IBox {
  get x () {
    return this.behaviors.x.value
  }
  get y () {
    return this.behaviors.y.value
  }
  get width () {
    return this.behaviors.width.value
  }
  get height () {
    return this.behaviors.height.value
  }
  get position () {
    return { x: this.x, y: this.y }
  }
  get size () {
    return { width: this.width, height: this.height }
  }
  get absX () {
    return this.behaviors.x.value + (this.parent ? this.parent.absX : 0)
  }
  get absY () {
    return this.behaviors.y.value + (this.parent ? this.parent.absY : 0)
  }
  // get innerWidth () {
  //   return this.behaviors.innerWidth.value
  // }
  // get innerHeight () {
  //   return this.behaviors.innerHeight.value
  // }

  $: Readonly<Streams>
  set: Setters

  private children: IBox[]
  private behaviors: Behaviors
  private widthBinding: SizeBinding
  private heightBinding: SizeBinding
  private subscription: Rx.Subscription

  private constructor (private config: IBoxConfig, private parent?: IBox) {
    this.children = []
    this.widthBinding = config.widthBinding ||
      ((config.layoutMechanism === LayoutMechanism.Horizontal) ?
        SizeBinding.ChildrenSum : SizeBinding.ChildMax)
    this.heightBinding = config.heightBinding || ((config.layoutMechanism === LayoutMechanism.Horizontal) ?
      SizeBinding.ChildMax : SizeBinding.ChildrenSum)
    this.initStreams(config, parent)
  }

  static create (config: IBoxConfigRoot) {
    return new Box(config)
  }

  // TODO: setX, setY should be only public for root box
  setX (x: number) { return this.behaviors.x.next(x) || true }
  setY (y: number) { return this.behaviors.y.next(y) || true }
  setWidth (width: number) {
    return this.widthBinding !== SizeBinding.Manual ? false :
      this.behaviors.width.next(width) || true
  }
  setHeight (height: number) {
    return this.heightBinding !== SizeBinding.Manual ? false :
      this.behaviors.height.next(height) || true
  }
  setPosition ({ x, y }: { x: number, y: number }) {
    this.behaviors.x.next(x)
    this.behaviors.y.next(y)
    return true
  }
  setSize ({ width, height }: { width: number, height: number }) {
    if (this.widthBinding === SizeBinding.Manual && this.heightBinding === SizeBinding.Manual) {
      this.behaviors.width.next(width)
      this.behaviors.height.next(height)
      return true
    }
    return false
  }

  remove (): boolean {
    if (this.parent) {
      this.parent.removeBox(this)
      delete this.parent
      return true
    }
    return false
  }

  addBox (config: IBoxConfig): IBox {
    const b = new Box(config, this)
    let insertAt
    if (config.insertAt === undefined) {
      insertAt = this.children.length
    } else if (typeof config.insertAt === 'number') {
      insertAt = config.insertAt
    } else {
      const { box, where } = config.insertAt
      const bIndex = this.children.indexOf(box)
      if (bIndex === -1) throw new Error('INCORRECT insertAt')
      insertAt = bIndex + where
    }

    this.children.splice(insertAt, 0, b)
    this.update()
    return b
  }

  removeBox (c: IBox): boolean {
    const idx = this.children.indexOf(c)
    if (idx === -1) return false
    this.children.splice(idx, 1)
    // todo: fix 
    if ((c as any).subscription) {
      (c as any).subscription.unsubscribe()
    }
    this.update()
    return true
  }

  private calculateSize (sizeBinding: SizeBinding) {
    return (sizes: number[]) => {
      if (sizeBinding === SizeBinding.ChildMax) {
        return Math.max(...sizes)
      } else if (sizeBinding === SizeBinding.ChildrenSum) {
        return sizes.reduce((acc, c) => acc + c, 0)
      }
      return NaN
    }
  }

  private update () {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.subscription =
      Rx.Observable.zip(
        Rx.Observable.of(this.children.map(c => c.$.width)),
        Rx.Observable.of(this.children.map(c => c.$.height))
      )
        .mergeMap(([widths$, heights$]) =>
          Rx.Observable.merge(
            this.widthBinding === SizeBinding.Manual ?
              this.$.width :
              Rx.Observable.combineLatest(...widths$)
                .map(this.calculateSize(this.widthBinding))
                .defaultIfEmpty(0)
                .do(w => this.behaviors.width.next(w)),
            this.heightBinding === SizeBinding.Manual ?
              this.$.height :
              Rx.Observable.combineLatest(...heights$)
                .map(this.calculateSize(this.heightBinding))
                .defaultIfEmpty(0)
                .do(h => this.behaviors.height.next(h))
          )
        )
        .subscribe()
  }

  private initStreams (config: IBoxConfig, parent?: IBox) {
    this.behaviors = {
      x: new Rx.BehaviorSubject(0),
      y: new Rx.BehaviorSubject(0),
      width: new Rx.BehaviorSubject(config.width || 0),
      height: new Rx.BehaviorSubject(config.height || 0)
      // innerWidth: new Rx.BehaviorSubject(0),
      // innerHeight: new Rx.BehaviorSubject(0)
    }
    this.$ = {
      x: this.behaviors.x.asObservable().distinctUntilChanged(),
      y: this.behaviors.y.asObservable().distinctUntilChanged(),
      width: this.behaviors.width.asObservable().distinctUntilChanged(),
      height: this.behaviors.height.asObservable().distinctUntilChanged()
    } as any
    Object.assign(this.$, {
      absX: this.parent ? Rx.Observable.combineLatest(
        this.parent.$.absX,
        this.$.x, (pX, x) => pX + x
      ) : this.$.x,
      absY: this.parent ? Rx.Observable.combineLatest(
        this.parent.$.absY,
        this.$.y, (pY, y) => pY + y
      ) : this.$.y,
      position: Rx.Observable
        .combineLatest(this.$.x, this.$.y, (x, y) => ({ x, y })),
      size: Rx.Observable
        .combineLatest(this.$.width, this.$.height, (width, height) => ({ width, height })),
      all: Rx.Observable
        .combineLatest(this.$.x, this.$.y, this.$.width, this.$.height,
        (x, y, width, height) => ({ x, y, width, height }))
    })
    Object.assign(this.$, {
      absPosition: Rx.Observable
        .combineLatest(this.$.absX, this.$.absY, (x, y) => ({ x, y }))
    })
  }
}
