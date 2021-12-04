'use strict'

// Import tools (I use tools from axios)
let utils = require('../../utils')
const mergeConfig = require("./mergeConfig");
const dispatchRequest = require("./dispatchRequest");


/**
 * create a new instance of Yaxios
 * @param {Object} instanceConfig The default config for the instance
 */
function Yaxios(instanceConfig){
    // Add default config
    this.defaults = instanceConfig;
    // Add interceptors
    this.interceptors = {
        //TODO: Implement InterceptorManager
        request: {},
        response: {}
    }
}

/**
 * Dispatch a request
 * @param {Object} config The config specific for this request, which is merged with this.defaults
 */
Yaxios.prototype.request = function request(config) {
    if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
    } else {
        config = config || {};
    }
    // merge the config that the use set
    config = mergeConfig(this.defaults, config);

    // Set config.method
    // set to the method of the config, if none, set to the one in default config, if none, set to 'get'
    if(config.method) {
        config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
    } else {
        config.method = 'get';
    }
    // create a promise
    let chain = [dispatchRequest, undefined];
    let promise = Promise.resolve(config);//  promise 成功的Promise

    //TODO: Hook up interceptors

    // If the chain is not empty 0
    while (chain.length) {
        //start executing all function in the chain
        // note that dispatchRequest is always the first to execute
        // if dispatchRequest failed, others functions do not get to execute at all
        // as it return a rejected promise instance with error message
        promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;

}

// Provide aliases for supported request methods  axios.get  axios.post axios.put
utils.forEach(['delete', 'get', 'head', 'options'], (method) => {
    /*eslint func-names:0*/
    Yaxios.prototype[method] = function (url, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url
        }));
    };
});

utils.forEach(['post', 'put', 'patch'], (method) => {
    /*eslint func-names:0*/
    Yaxios.prototype[method] = function (url, data, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url,
            data: data
        }));
    };
});

module.exports = Yaxios;