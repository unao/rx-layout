import { customLayoutFactory, CustomConfig } from '../src/box'

const rootConfig: CustomConfig = {
  layout: ({ dimensions, boxes }) => ({ updates: [] })
}

interface Labelled {
  label: string
}

const rootBox = customLayoutFactory<Labelled>(rootConfig)()


console.log(rootBox)
