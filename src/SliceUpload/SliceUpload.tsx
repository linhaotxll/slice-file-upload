import { h, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import type {
  BeforeFileHash,
  BeforeMergeChunk,
  BeforeUpload,
  BeforeUploadChunk,
  ChangeFileHash,
  Data,
  ErrorFileHash,
  ErrorMergeChunk,
  ErrorUploadChunk,
  MergeAction,
  MergeData,
  ProgressUploadChunk,
  SuccessFileHash,
  SuccessMergeChunk,
  SuccessUploadChunk,
  UploadAction,
  UploadData,
} from './interface'
import { useSliceUpload } from './useSliceUpload'

import './index.less'

const props = {
  /**
   * 发送到后台的切片参数名
   */
  name: String as PropType<string>,

  /**
   * 合并切片发送到后台的 hash 参数名
   */
  mergeName: String as PropType<string>,

  /**
   * 并发上传切片的最大个数
   */
  concurrentMax: Number as PropType<number>,

  /**
   * 并发上传切片失败的重试次数
   */
  concurrentRetryMax: Number as PropType<number>,

  /**
   * 上传文件前的钩子，若返回 false 则停止上传
   * 支持返回 Promise，reject 停止，resolve 继续
   */
  beforeUpload: Function as PropType<BeforeUpload>,

  /**
   * 上传切片的地址
   */
  uploadAction: [String, Function] as PropType<UploadAction>,

  /**
   * 上传切片时额外需要的参数
   * 支持返回 object 的函数，可异步
   */
  uploadData: [Object, Function] as PropType<UploadData>,

  /**
   * 上传切片请求头
   */
  uploadHeaders: Object as PropType<Data>,

  /**
   * 上传切片请求方法
   */
  uploadMethod: Object as PropType<string>,

  /**
   * 合并切片的地址
   */
  mergeAction: [String, Function] as PropType<MergeAction>,

  /**
   * 合并切片时额外需要的参数
   * 支持返回 object 的函数，可异步
   */
  mergeData: [Object, Function] as PropType<MergeData>,

  /**
   * 合并切片请求头
   */
  mergeHeaders: Object as PropType<Data>,

  /**
   * 合并切片请求方法
   */
  mergeMethod: Object as PropType<string>,

  /**
   * 是否禁用
   */
  disabled: Boolean as PropType<boolean>,

  /**
   * 切片大小
   */
  chunkSize: Number as PropType<number>,

  /**
   * 是否携带 cookie
   */
  withCredentials: Boolean as PropType<boolean>,

  /**
   * 计算 hash 前的钩子
   */
  onBeforeFileHash: Function as PropType<BeforeFileHash>,

  /**
   * 计算 hash 成功的钩子
   */
  onSuccessFileHash: Function as PropType<SuccessFileHash>,

  /**
   * 计算 hash 失败的钩子
   */
  onErrorFileHash: Function as PropType<ErrorFileHash>,

  /**
   * 计算 hash 改变的钩子
   */
  onChangeFileHash: Function as PropType<ChangeFileHash>,

  /**
   * 开始上传切片的钩子
   */
  onBeforeUploadChunk: Function as PropType<BeforeUploadChunk>,

  /**
   * 上传切片成功的钩子
   */
  onSuccessUploadChunk: Function as PropType<SuccessUploadChunk>,

  /**
   * 上传切片失败的钩子
   */
  onErrorUploadChunk: Function as PropType<ErrorUploadChunk>,

  /**
   * 上传切片 - 上传中 hook
   */
  onProgressUploadChunk: Function as PropType<ProgressUploadChunk>,

  /**
   * 开始合并切片的钩子
   */
  onBeforeMergeChunk: Function as PropType<BeforeMergeChunk>,

  /**
   * 合并切片成功的钩子
   */
  onSuccessMergeChunk: Function as PropType<SuccessMergeChunk>,

  /**
   * 合并切片失败的钩子
   */
  onErrorMergeChunk: Function as PropType<ErrorMergeChunk>,

  onChange: Function,
}

export const SliceUpload = defineComponent({
  name: 'SliceUpload',

  props,

  setup(props) {
    const {
      chunkSize,
      withCredentials,
      concurrentMax,
      concurrentRetryMax,

      uploadAction,
      uploadData,
      uploadHeaders,
      uploadMethod,

      mergeAction,
      mergeData,
      mergeHeaders,
      mergeMethod,

      name,
      mergeName,

      onBeforeFileHash,
      onSuccessFileHash,
      onErrorFileHash,
      onChangeFileHash,

      onBeforeUploadChunk,
      onSuccessUploadChunk,
      onErrorUploadChunk,
      onProgressUploadChunk,

      onBeforeMergeChunk,
      onSuccessMergeChunk,
      onErrorMergeChunk,
    } = props
    const inputRef = ref<HTMLInputElement | null>(null)

    const { start } = useSliceUpload({
      chunkSize,
      withCredentials,
      concurrentMax,
      concurrentRetryMax,

      name,
      uploadAction,
      uploadData,
      uploadHeaders,
      uploadMethod,

      mergeName,
      mergeAction,
      mergeData,
      mergeHeaders,
      mergeMethod,

      // hash hooks
      beforeFileHash: onBeforeFileHash,
      successFileHash: onSuccessFileHash,
      errorFileHash: onErrorFileHash,
      changeFileHash: onChangeFileHash,

      // upload chunks hooks
      beforeUploadChunk: onBeforeUploadChunk,
      successUploadChunk: onSuccessUploadChunk,
      errorUploadChunk: onErrorUploadChunk,
      progressUploadChunk: onProgressUploadChunk,

      // merge chunks hooks
      beforeMergeChunk: onBeforeMergeChunk,
      successMergeChunk: onSuccessMergeChunk,
      errorMergeChunk: onErrorMergeChunk,
    })

    /**
     * 打开文件选择框
     */
    const handleOpenSelectFile = () => {
      inputRef.value?.click()
    }

    /**
     * 触发打开文件选择框
     */
    const handleTrigger = () => {
      handleOpenSelectFile()
    }

    /**
     * 修改选择的文件
     */
    const handleChangeFile = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const { files } = target
      if (files && files[0]) {
        await start(files[0])
      }
      target.value = ''
    }

    return {
      inputRef,
      handleTrigger,
      handleOpenSelectFile,
      handleChangeFile,
    }
  },

  render() {
    const { $slots, handleTrigger, handleChangeFile } = this

    // input
    const $input = (
      <input
        type="file"
        class="upload-file-input"
        ref="inputRef"
        onChange={handleChangeFile}
      />
    )

    return (
      <div class="upload">
        <div class="upload-trigger" onClick={handleTrigger}>
          {$input}
          {$slots.default?.()}
        </div>
      </div>
    )
  },
})
