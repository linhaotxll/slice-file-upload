import { h, defineComponent } from 'vue'
import { SliceUpload } from '..'
import { request } from '../utils'

interface Response {
  code: number
  msg: string
  data: {
    title: string
  }
}

let c: () => void | undefined

export const App = defineComponent({
  render() {
    const handleSuspense = async () => {
      c?.()
    }

    const handleChangeFile = async (e: Event) => {
      const { files } = e.target as HTMLInputElement
      const file = files![0]

      const fd = new FormData()
      fd.append('file', file)

      console.log('开始请求')
      request({
        url: 'http://localhost:3000/api/common/upload-chun',
        method: 'POST',
        data: fd,
        timeout: 2000,
        onUploadProgress(loaded, total) {
          console.log('progress: ', loaded, total)
        },
        abort: cancel => {
          c = cancel
        },
        onObort() {
          console.log('取消了')
        },
        onTimeout() {
          console.log('超时了')
        },
      })
        .then(res => {
          console.log('请求成功: ', res)
        })
        .catch(err => {
          console.log('请求失败: ', err)
        })
    }

    return (
      <div class="1" id="2">
        <SliceUpload
          name="chunk"
          uploadAction="http://localhost:3000/api/common/upload-chunk"
          mergeAction="http://localhost:3000/api/common/merge-chunk"
          mergeHeaders={{ 'Content-Type': 'application/json; charset=utf-8' }}
          uploadData={({ file, fileHash, chunk }) => {
            const fd = new FormData()
            fd.append('chunk', chunk)
            fd.append('hash', fileHash)
            return fd
          }}
          mergeData={({ file, fileHash }) => {
            return { fileHash1: fileHash }
          }}
          onBeforeFileHash={(...args) => {
            console.log('before filehash: ', ...args)
          }}
          onSuccessFileHash={(...args) => {
            console.log('success filehash: ', ...args)
          }}
          onErrorFileHash={(...args) => {
            console.log('error filehash: ', ...args)
          }}
          onChangeFileHash={(...args) => {
            console.log('change filehash: ', ...args)
          }}
          onBeforeUploadChunk={(...args) => {
            console.log('before upload chunk: ', ...args)
          }}
          onSuccessUploadChunk={(...args) => {
            console.log('success upload chunk: ', ...args)
          }}
          onErrorUploadChunk={(...args) => {
            console.log('error upload chunk: ', ...args)
          }}
          onBeforeMergeChunk={(...args) => {
            console.log('before merge chunk: ', ...args)
          }}
          onSuccessMergeChunk={(...args) => {
            console.log('success merge chunk: ', ...args)
          }}
          onErrorMergeChunk={(...args) => {
            console.log('error merge chunk: ', ...args)
          }}
        >
          <button>Upload</button>
        </SliceUpload>

        <input type="file" onChange={handleChangeFile} />

        <button onClick={handleSuspense}>暂停</button>
      </div>
    )
  },
})
