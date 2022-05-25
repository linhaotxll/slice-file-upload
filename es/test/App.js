import { h, defineComponent } from 'vue';
import { SliceUpload } from '..';
export const App = defineComponent({
    render() {
        return (h("div", { class: "1", id: "2" },
            h(SliceUpload, { onBeforeFileHash: (...args) => {
                    console.log('before filehash: ', ...args);
                }, onSuccessFileHash: (...args) => {
                    console.log('success filehash: ', ...args);
                }, onErrorFileHash: (...args) => {
                    console.log('error filehash: ', ...args);
                }, onChangeFileHash: (...args) => {
                    console.log('change filehash: ', ...args);
                } },
                h("button", null, "Upload"))));
    },
});
//# sourceMappingURL=App.js.map