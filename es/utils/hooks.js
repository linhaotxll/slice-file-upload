import { error } from './logger';
export var Hooks;
(function (Hooks) {
    Hooks["BEFORE_FILE_HASH"] = "bfs";
    Hooks["SUCCESS_FILE_HASH"] = "sfs";
    Hooks["CHANGE_FILE_HASH"] = "cfs";
    Hooks["ERROR_FILE_HASH"] = "efs";
    Hooks["BEFORE_UPLOAD_CHUNK"] = "buc";
    Hooks["SUCCESS_UPLOAD_CHUNK"] = "suc";
    Hooks["ERROR_UPLOAD_CHUNK"] = "euc";
    Hooks["BEFORE_MERGE_CHUNK"] = "bmc";
    Hooks["SUCCESS_MERGE_CHUNK"] = "smc";
    Hooks["ERROR_MERGE_CHUNK"] = "emc";
})(Hooks || (Hooks = {}));
export const ErrorTypeString = {
    [Hooks.BEFORE_FILE_HASH]: 'before fileHash hook',
    [Hooks.SUCCESS_FILE_HASH]: 'success fileHash hook',
    [Hooks.ERROR_FILE_HASH]: 'error fileHash hook',
    [Hooks.CHANGE_FILE_HASH]: 'change fileHash hook',
    [Hooks.BEFORE_UPLOAD_CHUNK]: 'before uploadChunk hook',
    [Hooks.SUCCESS_UPLOAD_CHUNK]: 'success uploadChunk hook',
    [Hooks.ERROR_UPLOAD_CHUNK]: 'error uploadChunk hook',
    [Hooks.BEFORE_MERGE_CHUNK]: 'before mergeChunk hook',
    [Hooks.SUCCESS_MERGE_CHUNK]: 'success mergeChunk hook',
    [Hooks.ERROR_MERGE_CHUNK]: 'error mergeChunk hook',
};
export const invokeHooks = (fn, errorType, ...args) => {
    let res;
    try {
        res = args ? fn(args) : fn();
    }
    catch (e) {
        handleError(e, errorType);
    }
    return res;
};
export const handleError = (e, errorType) => {
    const errorInfo = ErrorTypeString[errorType];
    error(`Unhandled error during execution of ${errorInfo}: ${e}`);
};
//# sourceMappingURL=hooks.js.map