import SparkMD5 from 'spark-md5'

import type { FileHashToMain, FileHashToWorker } from './internal-interface'

globalThis.addEventListener('message', (e) => {
  let loadCount = 0
  const { chunks } = e.data as FileHashToWorker
  const total = chunks.length
  const spark = new SparkMD5.ArrayBuffer()

  const load = (index: number) => {
    const chunk = chunks[index]
    const fileReader = new FileReader()

    fileReader.addEventListener('load', (e) => {
      spark.append(e.target?.result as ArrayBuffer)

      const data: FileHashToMain = {
        done: false,
        progress: (++loadCount / total) * 100,
        index,
      }

      if (loadCount === total) {
        globalThis.postMessage({
          ...data,
          done: true,
          fileHash: spark.end(),
        })
        return
      }

      globalThis.postMessage({ ...data })

      load(index + 1)
    })

    fileReader.addEventListener('error', (error) => {
      const data: FileHashToMain = {
        done: false,
        progress: (++loadCount / total) * 100,
        index,
        error,
      }
      globalThis.postMessage(data)
    })

    fileReader.readAsArrayBuffer(chunk.blob)
  }

  load(0)
})
