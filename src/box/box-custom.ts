import { Observable } from 'rxjs/Observable'

import { Box, Params, DimensionsBase } from './box.types'
export interface LayoutFn<I> {
  ({ dimensions, boxes }: { dimensions: DimensionsBase, boxes: Array<[DimensionsBase, I]> }): {
    // if absent default will be calculated by default mechanism
    innerWidth?: number
    innerHeight?: number
    // the length of updates MUST match the length of boxes -
    // false at position n indicates no updates for Box at position n
    updates: Array<DimensionsBase | false>
  }
}

export interface CustomConfig<I = undefined> {
  layout: LayoutFn<I>
  infoRequired?: boolean
}

export const customLayoutFactory = <ChildInfo = any, Info = undefined>(config: CustomConfig) =>
  (p: Params & { info?: Info } = {}): Box<ChildInfo, Info> => {
    if (config.infoRequired && p.info === undefined) {
      throw new Error('Missing "info".')
    }
    
    return { $: null, info: p.info } as any
  }
