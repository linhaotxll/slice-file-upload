// self.importScripts('./lib/spark-md5.min.js')

// self.addEventListener('message', e => {
//   let loadCount = 0
//   const { chunks } = e.data
//   const total = chunks.length
//   const spark = new SparkMD5.ArrayBuffer()

//   const load = index => {
//     const chunk = chunks[index]
//     const fileReader = new FileReader()

//     fileReader.addEventListener('load', e => {
//       if (++loadCount === total) {
//         self.postMessage({
//           done: true,
//           fileHash: spark.end(),
//           progress: 100,
//           index,
//         })
//         return
//       }

//       self.postMessage({
//         done: false,
//         progress: (loadCount / total) * 100,
//         index,
//       })
//     })

//     fileReader.addEventListener('error', e => {})

//     fileReader.readAsArrayBuffer(chunk)
//   }

//   load(0)
// })

import SparkMD5 from 'spark-md5'
import { FileHashToMain, FileHashToWorker } from './internal-interface'

self.addEventListener('message', e => {
  let loadCount = 0
  const { chunks } = e.data as FileHashToWorker
  const total = chunks.length
  const spark = new SparkMD5.ArrayBuffer()

  const load = (index: number) => {
    const chunk = chunks[index]
    const fileReader = new FileReader()

    fileReader.addEventListener('load', e => {
      spark.append(e.target?.result as ArrayBuffer)

      const data: FileHashToMain = {
        done: false,
        progress: (++loadCount / total) * 100,
        index,
      }

      if (loadCount === total) {
        self.postMessage({
          ...data,
          done: true,
          fileHash: spark.end(),
        })
        return
      }

      self.postMessage({ ...data })

      load(index + 1)
    })

    fileReader.addEventListener('error', error => {
      const data: FileHashToMain = {
        done: false,
        progress: (++loadCount / total) * 100,
        index,
        error,
      }
      self.postMessage(data)
    })

    fileReader.readAsArrayBuffer(chunk)
  }

  load(0)
})
