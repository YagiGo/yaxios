'use strict';
//发送请求的函数文件

//引入工具
let utils = require('../../../yaxios/utils');
//引入数据转化工具
let transformData = require('./transformData');
//引入请求的默认配置
let defaults = require('../defaults');

//TODO: Implement Cancel related function

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
    // Ensure headers exist
    config.headers = config.headers || {};

    // transform headers and data
    config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
    );

    // merge other headers
    config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
    );

    // method-related header items are not necessary so we remove them
    utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
            delete config.headers[method];
        }
    );

    // get the adapter for sending the request. It is either XHR or HTTP
    let adapter = config.adapter || defaults.adapter;

    //发送请求， 返回请求后 promise 对象  ajax HTTP
    return adapter(config).then((response) => {
        // If succeeding,
        // Transform response data
        response.data = transformData(
            response.data,
            response.headers,
            config.transformResponse
        );
        // return the actual response as the result
        return response;
    }, (reason) => {
        // if failed, reject with error message
        // Transform response data
        if (reason && reason.response) {
            reason.response.data = transformData(
                reason.response.data,
                reason.response.headers,
                config.transformResponse
            );
        }
        //设置 promise 为失败, 失败的值为错误信息
        return Promise.reject(reason);
    });
};
