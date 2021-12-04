'use strict'

// Import tools (I use tools from axios)
let utils = require('../../utils')
const mergeConfig = require("./mergeConfig");
const buildURL = require("../helpers/buildURL");


/**
 * create a new instance of Yaxios
 * @param {Object} instanceConfig The default config for the instance
 */
const Yaxios = (instanceConfig) => {
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
Yaxios.prototype.request = (config) => {
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
    let promise = Promise.resolve(config);//  promise 成功的Promise

    //TODO: Hook up interceptors

    return promise
}

Yaxios.prototype.getUri = (config) => {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

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