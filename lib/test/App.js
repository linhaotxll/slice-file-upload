"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const vue_1 = require("vue");
const __1 = require("..");
exports.App = (0, vue_1.defineComponent)({
    render() {
        return ((0, vue_1.h)("div", { class: "1", id: "2" },
            (0, vue_1.h)(__1.SliceUpload, { onBeforeFileHash: (...args) => {
                    console.log('before filehash: ', ...args);
                }, onSuccessFileHash: (...args) => {
                    console.log('success filehash: ', ...args);
                }, onErrorFileHash: (...args) => {
                    console.log('error filehash: ', ...args);
                }, onChangeFileHash: (...args) => {
                    console.log('change filehash: ', ...args);
                } },
                (0, vue_1.h)("button", null, "Upload"))));
    },
});
//# sourceMappingURL=App.js.map