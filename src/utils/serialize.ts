import { isPlainObject } from './types'

export function serializeForm (data: Record<string, any>) {
  const result: string[] = []
  if (isPlainObject(data)) {
    Object.keys(data).forEach((key) => {
      result.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    })
  }
  return result.join('&')
}
