/**
 * How yaxios create and use interceptors
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

const yaxios = createInstance({
    method: 'GET',
    url: "http://localhost:3000/posts",
    cancelToken: new CancelToken((c) => {cancel = c;})
});

yaxios.request({
    method: 'GET',
    url: 'http://localhost:3000/posts'
}).then((res) => {console.log(res);})

