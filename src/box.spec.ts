import { expect } from 'chai'

import { Box, LayoutMechanism, InsertPosition } from './box'

describe('Box', () => {

  it('should create simple box', () => {
    const b = Box.create({ layoutMechanism: LayoutMechanism.Horizontal })
    expect(b.x).to.equal(0)
    expect(b.y).to.equal(0)
    expect(b.width).to.equal(0)
    expect(b.height).to.equal(0)
  })

  it('should create 1-deep nested boxes, support insertAt and remove', () => {
    const b = Box.create({ layoutMechanism: LayoutMechanism.Horizontal })
    const c0 = b.addBox({
      layoutMechanism: LayoutMechanism.Horizontal,
      width: 100,
      height: 100
    })
    const c1 = b.addBox({
      layoutMechanism: LayoutMechanism.Horizontal,
      width: 200,
      height: 200,
      insertAt: 0
    })
    const c2 = b.addBox({
      layoutMechanism: LayoutMechanism.Horizontal,
      width: 300,
      height: 300,
      insertAt: { box: c1, where: InsertPosition.After }
    })
    expect((b as any).children).to.satisfy(cs =>
      cs[0] === c1 && cs[1] === c2 && cs[2] === c0
    )
    b.$.size
      .take(1)
      .subscribe(size => expect(size).to.deep.equal({ width: 600, height: 300 }))
    b.removeBox(c1)
    b.removeBox(c2)
    b.$.size
      .take(1)
      .subscribe(size => expect(size).to.deep.equal({ width: 100, height: 100 }))
    b.removeBox(c0)
    b.$.size
      .take(1)
      .subscribe(size => expect(size).to.deep.equal({ width: 0, height: 0 }))
  })
})
