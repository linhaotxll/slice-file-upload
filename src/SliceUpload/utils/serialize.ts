import { isPlainObject } from './types'

export const serializeForm = (data: Record<string, unknown>) => {
  const result: string[] = []
  if (isPlainObject(data)) {
    Object.keys(data).forEach(key => {
      result.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    })
  }
  return result.join('&')
}
