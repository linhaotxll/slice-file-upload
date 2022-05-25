export const isString = (value: unknown): value is string =>
  typeof value === 'string'

export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function'
