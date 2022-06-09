const hasOwn = (prop: PropertyKey, obj: object) =>
  Object.prototype.hasOwnProperty.call(obj, prop)

export function merge<T, S1>(target: T, source1: S1): T & S1
export function merge<T, S1, S2>(
  target: T,
  source1: S1,
  source2: S2
): T & S1 & S2
export function merge<T, S1, S2, S3>(
  target: T,
  source1: S1,
  source2: S2,
  source3: S3
): T & S1 & S2 & S3
export function merge(
  target: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
) {
  let index = -1
  let sourceIndex = -1
  while (++index < sources.length) {
    const source = sources[index]
    const sourceKeys = Object.keys(source)
    sourceIndex = -1
    while (++sourceIndex < sourceKeys.length) {
      const sourceKey = sourceKeys[sourceIndex]
      if (hasOwn(sourceKey, source) && source[sourceKey] !== undefined) {
        target[sourceKey] = source[sourceKey]
      }
    }
  }

  return target
}
