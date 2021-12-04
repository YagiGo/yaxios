'use strict'
const utils = require('../utils');
const bind = require('../helper/bind');
const Yaxios = require('./core/Yaxios');
const defaults = require('./defaults');

/**
 * create an instance of Axios
 * @param {Object} defaultConfig
 * @return
 */
const createInstance = (defaultConfig) => {
    // create a Axios instance
    let context = new Yaxios(defaultConfig);
    // bind the context to Axios.prototype.request so that it can be used as a function
    let instance = bind(Yaxios.prototype.request, context);
    // bind methods from Yaxios.prototype and Yaxios instance to the instance so that they can be
    // called directly from the instance. Hence, instance.defaults, instance.interceptors, instance.request,
    // instance.get, instance.post, instance.delete, e.t.c
    utils.extend(instance, Yaxios.prototype, context);
    utils.extend(instance, context);
}