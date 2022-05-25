"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.concurrentRequest = void 0;
const defaultOptions = {
    max: 3,
    retryCount: 0,
};
const concurrentRequest = (requests, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const resolveOptions = (Object.assign(Object.assign({}, defaultOptions), options));
        const total = requests.length;
        const errorRequests = [];
        const retryCountsMap = new Map();
        let { max, retryCount } = resolveOptions;
        let count = 0;
        let index = 0;
        const start = () => {
            while ((errorRequests.length || index < total) && max > 0) {
                const isCallErrorRequest = !!errorRequests.length;
                const request = errorRequests.length
                    ? errorRequests.shift()
                    : requests[index];
                if (!request) {
                    continue;
                }
                // 每执行一个请求，需要回收一个 max，索引往后移一位
                --max;
                if (!isCallErrorRequest) {
                    ++index;
                }
                request()
                    .then(() => {
                    // 每个请求成功后，累加 count
                    count++;
                    if (count === total) {
                        resolve(undefined);
                    }
                    else {
                        start();
                    }
                })
                    .catch(e => {
                    // 累加重试次数，超出次数直接 reject
                    let count = retryCountsMap.get(request) || 0;
                    if (count >= retryCount) {
                        return reject(e);
                    }
                    retryCountsMap.set(request, count + 1);
                    errorRequests.push(request);
                    start();
                })
                    .finally(() => {
                    // 每个请求结束完成后，释放 max
                    ++max;
                });
            }
        };
        start();
    });
});
exports.concurrentRequest = concurrentRequest;
//# sourceMappingURL=send-request.js.map