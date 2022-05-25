"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
const _error = console.error;
const error = (message, ...args) => {
    const errorArgs = [`[SliceUpload error]: ${message}`, ...args];
    _error(errorArgs);
};
exports.error = error;
//# sourceMappingURL=logger.js.map