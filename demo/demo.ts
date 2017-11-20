import { Box, LayoutMechanism } from '../src/box'

const root = Box.create({
  layoutMechanism: LayoutMechanism.Horizontal
});

(window as any).root = root;

(window as any).c1 = root.addBox({
  layoutMechanism: LayoutMechanism.Vertical,
  width: 200,
  height: 200
})
console.log('DEMO', root)
