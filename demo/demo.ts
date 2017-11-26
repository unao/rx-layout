import * as Rx from 'rxjs'

import { customLayoutFactory, CustomConfig } from '../src/box'

const $ = Rx.Observable

const rootConfig: CustomConfig = {
  layout: (box, boxes) => {
    console.log('LAYOUT', box, boxes)
    return { updates: [] }
  },
  defaultNumber: 0
}

interface Labelled {
  label: string
}

const rootBox = customLayoutFactory<Labelled>(rootConfig)({
  widthOuter: $.fromEvent(window, 'resize').startWith(true).map(() => window.innerWidth),
  heightOuter: $.fromEvent(window, 'resize').startWith(true).map(() => window.innerHeight)
});
(window as any).R = rootBox

// $.combineLatest(rootBox.$.widthOuter, rootBox.$.heightOuter)
//   .do(x => console.log('OUTER', x))
//   .subscribe()

$.combineLatest(rootBox.$.widthInner, rootBox.$.heightInner)
  .debounceTime(0)
  .do(x => console.log('INNER', x))
  .subscribe()

const header = customLayoutFactory<any, Labelled>({ layout: () => ({ updates: [] }) })()
const main = customLayoutFactory<any, Labelled>({ layout: () => ({ updates: [] }) })()
const side = customLayoutFactory<any, Labelled>({ layout: () => ({ updates: [] }) })()

header.widthOuter = 200

main.x = 200
main.widthOuter = 1000
main.margin.right = 20

rootBox.addBox(header)
rootBox.addBox(main)
rootBox.addBox(side)
