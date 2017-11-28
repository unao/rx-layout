import * as Rx from 'rxjs'

import { LayoutUpdates, customLayoutFactory, CustomConfig, observeBox } from '../src/box'

const $ = Rx.Observable

const rootConfig: CustomConfig<RootChild> = {
  layout: (box, boxes) => {
    // console.log('LAYOUT', box, boxes.map(b => b.info))
    const [main, header, side] = boxes
    const headerHeight = 64
    const sideWidth = side ? side.widthOuter : 0
    const updates: LayoutUpdates = [{
      x: sideWidth,
      y: headerHeight,
      widthOuter: box.widthOuter - sideWidth,
      heightOuter: box.heightOuter - headerHeight
    }, {
      x: 0,
      y: 0,
      widthOuter: box.widthOuter,
      heightOuter: headerHeight
    }]
    return {
      updates: updates.concat(side ? [{
        x: 0,
        y: headerHeight,
        widthOuter: side.widthOuter,
        heightOuter: box.heightOuter - headerHeight
      }] : [])
    }
  },
  defaultNumber: 0
  // bindOuterToInner: true
}

type Label = 'header' | 'side' | 'main'
interface RootChild {
  label: Label
  el: HTMLDivElement
}

const rootBox = customLayoutFactory<RootChild>(rootConfig)({
  widthOuter: $.fromEvent(window, 'resize').startWith(true).map(() => window.innerWidth),
  heightOuter: $.fromEvent(window, 'resize').startWith(true).map(() => window.innerHeight)
})

const labels: Array<Label> = ['main', 'header', 'side']
const colors = ['rgba(128,128,128,0.5)', 'rgba(128,128,128,0.25)', 'rgba(128,128,128,0.75)']
const emptyLayout = customLayoutFactory<any, RootChild>({ layout: () => ({ updates: [] }) })

const boxes = labels.map(l => emptyLayout({ info: { label: l, el: document.createElement('div') } }))
boxes.forEach((b, idx) => {
  rootBox.insertBox(b)
  document.body.appendChild(b.info.el)
  b.info.el.style.backgroundColor = colors[idx]
  b.info.el.style.position = 'absolute'
})

const [main, header, side] = boxes
side.widthOuter = 256

// todo add flag to observe automatically
$.combineLatest(rootBox.$.widthInner, rootBox.$.heightInner).subscribe()

$.from(
  boxes.map(b => observeBox(b)
    .map(() => ({
      width: `${b.widthOuter}px`,
      height: `${b.heightOuter}px`,
      transform: `translate(${b.x}px, ${b.y}px)`
    }))
    .do(s => Object.assign(b.info.el.style, s))
    .do(s => b.info.el.innerHTML = `<pre>${JSON.stringify(s, null, 4)}</pre>`)
  )
)
  .mergeAll()
  .subscribe(x => console.log(x))
