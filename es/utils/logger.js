const _error = console.error;
export const error = (message, ...args) => {
    const errorArgs = [`[SliceUpload error]: ${message}`, ...args];
    _error(errorArgs);
};
//# sourceMappingURL=logger.js.map