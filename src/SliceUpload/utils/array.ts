export const forEach = <T>(
  array: T[],
  fn: (item: T, index: number, arrya: T[]) => void
) => {
  const len = array.length
  let i = -1
  while (++i < len) {
    fn(array[i], i, array)
  }
}
