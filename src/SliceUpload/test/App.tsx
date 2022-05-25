import { h, defineComponent } from 'vue'
import { SliceUpload } from '..'

export const App = defineComponent({
  render() {
    return (
      <div class="1" id="2">
        <SliceUpload
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
        >
          <button>Upload</button>
        </SliceUpload>
      </div>
    )
  },
})
