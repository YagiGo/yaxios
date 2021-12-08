/**
 * How yaxios create and use interceptors
 */

/**
 * Yaxios Object
 * @param config
 */
function Yaxios(config) {
    this.config = config;
    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    }
}

Yaxios.prototype.request = function(config) {
    let promise = Promise.resolve(config);
    let chain = [dispatchRequest, undefined];

    // Deal with the interceptors
    this.interceptors.request.handlers.forEach((interceptors) => {
        // chain.unshift(interceptors.fulfilled, interceptors.rejected);
        chain = [interceptors.fulfilled, interceptors.rejected, ...chain];
    })
    this.interceptors.response.handlers.forEach((interceptors) => {
        // chain.push(interceptors.fulfilled, interceptors.rejected);
        chain = [...chain, interceptors.fulfilled, interceptors.rejected];
    })
    while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
    }
    return promise;
}

function createInstance(config) {
    const ctx = new Yaxios(config);
    const instance = Yaxios.prototype.request.bind(ctx);
    Object.keys(Yaxios.prototype).forEach((key) => {
        instance[key] = Yaxios.prototype[key];
    })

    Object.keys(ctx).forEach((key) => {
        instance[key] = ctx[key];
    })

    return instance;
}


const dispatchRequest = (config) => {
    return xhrAdapter(config);
}

/**
 * XHR Adapter
 * @param config the config file
 * @returns {Promise<XMLHttpRequest>} result of AJAX
 */
const xhrAdapter = (config) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(config.method, config.url);

        // now we implement the cancellation
        if(config.tokenCancel) {
            config.tokenCancel.promise.then((msg) => {
                xhr.abort();
            })
        }

        xhr.send();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(
                        {
                            config: config,
                            data: xhr.response,
                            headers: xhr.getAllResponseHeaders(),
                            request: xhr,
                            status: xhr.status,
                            statusText: xhr.statusText
                        });
                }
                else {
                    reject(new Error('FAILED with code' + xhr.status))
                }
            }
        }
    })
}

/**
 * Interceptors
 */
function InterceptorManager() {
    this.handlers = []
}

InterceptorManager.prototype.use = function(fulfilled, rejected) {
    this.handlers.push(
        {
            fulfilled: fulfilled,
            rejected: rejected
        });
    return this.handlers.length - 1;
}

/**
 * CancelToken
 * @param executor the function that is set as the cancelToken in the config
 */
function CancelToken(executor) {
    let resolvePromise;
    this.promise = new Promise(resolve => {
        resolvePromise = resolve;
    })
    let token = this; // so that we can see if the request has been cancelled or not
    executor((message) => {
        if (token.reason) return;
        token.reason = message
        resolvePromise(token.reason);
    })
}
