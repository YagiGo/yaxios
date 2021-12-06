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

const xhrAdapter = (config) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(config.method, config.url);
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

const yaxios = createInstance({method: 'GET', url: "http://localhost:3000/posts"});
// Add a request interceptor
yaxios.interceptors.request.use(function (config) {
    // Do something before request is sent
    console.log('req interceptors No.1:', config);
    // you can alter the config her
    //e.g
    config.params = {a: 100}
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a request interceptor
yaxios.interceptors.request.use(function (config) {
    // Do something before request is sent
    console.log('req interceptors No.2:', config);
    // you can alter the config her
    //e.g
    config.params = {a: 100}
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
yaxios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    console.log('res interceptors No.1:', response);
    // you can modify the response here
    // e.g only return the payload
    return response;
}, (error) => {
    console.log('response interceptor failed')
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
});

// Add a response interceptor
yaxios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    console.log('res interceptors No.2:', response);
    // you can modify the response here
    // e.g only return the payload
    return response;
}, (error) => {
    console.log('response interceptor failed')
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
});

yaxios.request({
    method: 'GET',
    url: 'http://localhost:3000/posts'
}).then((res) => {console.log(res);})

