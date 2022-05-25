var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Hooks, invokeHooks } from './utils';
// 10M
const CHUNK_SIZE = 1024 * 1024 * 10;
// eslint-disable-next-line
const noop = () => { };
const defaultOptions = {
    chunkSize: CHUNK_SIZE,
    concurrentMax: 2,
    beforeFileHash: noop,
    changeFileHash: noop,
    successFileHash: noop,
    errorFileHash: noop,
};
export const useSliceUpload = (options = {}) => {
    // merge options
    const { chunkSize, beforeFileHash, successFileHash, changeFileHash } = Object.assign(Object.assign({}, defaultOptions), options);
    /**
     * 创建文件切片
     */
    const createChunks = (file, chunkSize) => {
        let currentSize = 0;
        const chunks = [];
        const total = file.size;
        while (currentSize < total) {
            chunks.push(file.slice(currentSize, currentSize + chunkSize));
            currentSize += chunkSize;
        }
        return chunks;
    };
    /**
     * 计算文件 hash
     */
    const createFileHash = (file, chunks) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            // invoke before filehash hook
            invokeHooks(beforeFileHash, Hooks.BEFORE_FILE_HASH, file, chunks);
            // const workerBlob = new Blob([workerString], { type: 'text/javascript' })
            // const workerURL = URL.createObjectURL(workerBlob)
            // const worker = new Worker(workerURL)
            // // const worker = new Worker('./worker.js?worker', { type: 'classic' })
            // worker.addEventListener('message', e => {
            //   // e.data
            //   // fileHash
            //   // pregress
            //   // done
            //   const { fileHash, progress, index, done } = e.data
            //   if (done) {
            //     // TODO: 是否真的需要这个 hook
            //     invokeHooks(successFileHash, Hooks.SUCCESS_FILE_HASH, fileHash, file, chunks)
            //     return resolve(fileHash)
            //   }
            //   // change filehash hook
            //   invokeHooks(changeFileHash, Hooks.CHANGE_FILE_HASH, {
            //     file,
            //     progress,
            //     index,
            //     chunks,
            //   })
            // })
            // worker.addEventListener('messageerror', () => {
            //   // TODO:
            //   reject()
            // })
        });
    });
    /**
     * 开始上传
     */
    const start = (file) => __awaiter(void 0, void 0, void 0, function* () {
        // TODO: beforeUpload 校验文件
        const chunks = createChunks(file, chunkSize);
        const fileHash = yield createFileHash(file, chunks);
        console.log('fileHash: ', fileHash);
    });
    return {
        start,
    };
};
//# sourceMappingURL=useSliceUpload.js.map