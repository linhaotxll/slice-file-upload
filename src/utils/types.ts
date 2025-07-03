const toString = Object.prototype.toString
const toRawType = (value: unknown) => toString.call(value)
const toType = (value: unknown) => toRawType(value).slice(8, -1)

export function isNumber (value: unknown): value is number {
  return typeof value === 'number'
}

export function isString (value: unknown): value is string {
  return typeof value === 'string'
}

export function isFunction (value: unknown): value is (...args: any)=> any {
  return typeof value === 'function'
}

export function isPlainObject (value: unknown): value is Record<string, any> {
  return toType(value) === 'Object'
}

export function isFormData (value: unknown): value is FormData {
  return toType(value) === 'FormData'
}

export function isObject (value: unknown): value is Record<any, any> {
  return typeof value === 'object' && value !== null
}

export function isPromise<T = any> (value: unknown): value is Promise<T> {
  return isObject(value) && isFunction(value.then) && isFunction(value.catch)
}

export function isError (value: unknown): value is Error {
  return toType(value) === 'Error'
}
