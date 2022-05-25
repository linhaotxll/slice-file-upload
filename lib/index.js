"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SliceUpload = void 0;
const vue_1 = require("vue");
require("./index.less");
const useSliceUpload_1 = require("./useSliceUpload");
const props = {
    /**
     * 发送到后台的切片参数名
     */
    name: String,
    /**
     * 上传文件前的钩子，若返回 false 则停止上传
     * 支持返回 Promise，reject 停止，resolve 继续
     */
    beforeUpload: Function,
    /**
     * 上传切片的地址
     */
    uploadAction: [String, Function],
    /**
     * 上传切片时额外需要的参数
     * 支持返回 object 的函数，可异步
     */
    uploadData: [Object, Function],
    /**
     * 上传切片请求头
     */
    uploadHeaders: Object,
    /**
     * 上传切片请求方法
     */
    uploadMethod: Object,
    /**
     * 合并切片的地址
     */
    mergeAction: [String, Function],
    /**
     * 合并切片时额外需要的参数
     * 支持返回 object 的函数，可异步
     */
    mergeData: [Object, Function],
    /**
     * 合并切片请求头
     */
    mergeHeaders: Object,
    /**
     * 合并切片请求方法
     */
    mergeMethod: Object,
    /**
     * 是否禁用
     */
    disabled: Boolean,
    /**
     * 切片大小
     */
    chunkSize: Number,
    /**
     * 是否携带 cookie
     */
    withCredentials: Boolean,
    /**
     * 计算 hash 前的钩子
     */
    onBeforeFileHash: Function,
    /**
     * 计算 hash 成功的钩子
     */
    onSuccessFileHash: Function,
    /**
     * 计算 hash 失败的钩子
     */
    onErrorFileHash: Function,
    /**
     * 计算 hash 改变的钩子
     */
    onChangeFileHash: Function,
    onChange: Function,
};
exports.SliceUpload = (0, vue_1.defineComponent)({
    name: 'SliceUpload',
    props,
    setup(props) {
        const { chunkSize, onBeforeFileHash, onSuccessFileHash, onErrorFileHash, onChangeFileHash } = props;
        const inputRef = (0, vue_1.ref)(null);
        const { start } = (0, useSliceUpload_1.useSliceUpload)({
            chunkSize,
            // hash hooks
            beforeFileHash: onBeforeFileHash,
            successFileHash: onSuccessFileHash,
            errorFileHash: onErrorFileHash,
            changeFileHash: onChangeFileHash,
        });
        /**
         * 打开文件选择框
         */
        const handleOpenSelectFile = () => {
            var _a;
            (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.click();
        };
        /**
         * 触发打开文件选择框
         */
        const handleTrigger = () => {
            handleOpenSelectFile();
        };
        /**
         * 修改选择的文件
         */
        const handleChangeFile = (e) => {
            const target = e.target;
            const { files } = target;
            if (files && files[0]) {
                start(files[0]);
            }
            target.value = '';
        };
        return {
            inputRef,
            handleTrigger,
            handleOpenSelectFile,
            handleChangeFile,
        };
    },
    render() {
        var _a;
        const { $slots, handleTrigger, handleChangeFile } = this;
        // input
        const $input = ((0, vue_1.h)("input", { type: "file", class: "upload-file-input", ref: "inputRef", onChange: handleChangeFile }));
        return ((0, vue_1.h)("div", { class: "upload" },
            (0, vue_1.h)("div", { class: "upload-trigger", onClick: handleTrigger },
                $input, (_a = $slots.default) === null || _a === void 0 ? void 0 :
                _a.call($slots))));
    },
});
//# sourceMappingURL=index.js.map