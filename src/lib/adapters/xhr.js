'use strict';
//浏览器端发送 AJAX 请求实现
var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
            delete requestHeaders['Content-Type']; // Let the browser set it
        }
        //创建请求对象
        var request = new XMLHttpRequest();

        // HTTP basic authentication
        // HTTP 基础验证处理
        if (config.auth) {
            var username = config.auth.username || '';
            var password = config.auth.password || '';
            requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        //构建完整URL地址, 初始化请求
        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        // 设置超时时间
        request.timeout = config.timeout;

        // Listen for ready state
        //绑定事件
        request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
                return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
                return;
            }

            // Prepare the response
            //获取所有的响应头
            var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
            var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
            // 拼接响应的结果
            var response = {
                data: responseData,
                status: request.status,
                statusText: request.statusText,
                headers: responseHeaders,
                config: config,
                request: request
            };
            //根据响应修改 promise 的状态
            settle(resolve, reject, response);

            // Clean up request
            request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
            if (!request) {
                return;
            }

            reject(createError('Request aborted', config, 'ECONNABORTED', request));

            // Clean up request
            request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
            // Real errors are hidden from us by the browser
            // onerror should only fire if it's a network error
            reject(createError('Network Error', config, null, request));

            // Clean up request
            request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
            var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
            if (config.timeoutErrorMessage) {
                timeoutErrorMessage = config.timeoutErrorMessage;
            }
            reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
                request));

            // Clean up request
            request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
            var cookies = require('./../helpers/cookies');

            // Add xsrf header
            var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
                cookies.read(config.xsrfCookieName) :
                undefined;

            if (xsrfValue) {
                requestHeaders[config.xsrfHeaderName] = xsrfValue;
            }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
            utils.forEach(requestHeaders, function setRequestHeader(val, key) {
                if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
                    // Remove Content-Type if data is undefined
                    delete requestHeaders[key];
                } else {
                    // Otherwise add header to the request
                    request.setRequestHeader(key, val);
                }
            });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
            request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
            try {
                request.responseType = config.responseType;
            } catch (e) {
                // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
                // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
                if (config.responseType !== 'json') {
                    throw e;
                }
            }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
            request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
            request.upload.addEventListener('progress', config.onUploadProgress);
        }

        //如果配置了 cancelToken 则调用 then 方法设置成功的回调
        if (config.cancelToken) {
            // Handle cancellation
            config.cancelToken.promise.then(function onCanceled(cancel) {
                if (!request) {
                    return;
                }
                //取消请求
                request.abort();
                reject(cancel);
                // Clean up request
                request = null;
            });
        }

        if (requestData === undefined) {
            requestData = null;
        }

        // Send the request
        request.send(requestData);
    });
};
