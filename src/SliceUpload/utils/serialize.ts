import { forEach } from './array'
import { isPlainObject } from './types'

export const serializeForm = (data: Record<string, unknown>) => {
  const result: string[] = []
  if (isPlainObject(data)) {
    forEach(Object.keys(data), key => {
      result.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    })
  }
  return result.join('&')
}
