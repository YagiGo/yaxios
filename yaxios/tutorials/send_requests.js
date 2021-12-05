/*
    This tutorial shows how an yaxios instance is created. This is identical to the Axios, but simplified
    该文件由于展示Yaxios实例如何被创建，此过程与Axios完全一致，但经过简化，仅仅保留核心逻辑
 */
const defaultConfig={
    method: 'GET',
    baseURL: 'http://localhost:3000'
}

function Yaxios(config) {
    this.defaults = config? config : defaultConfig;
    this.interceptors = {
        // we don't add interceptor here for the sake of simplicity
        request: {},
        response: {}
    }
}

Yaxios.prototype.request = (config) => {
    let promise = Promise.resolve(config);
    let chain = [dispatchRequest, undefined];
    return promise.then(chain[0], chain[1]);
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

const createInstance = (config) => {
    let context = new Yaxios(config);
    let instance = Yaxios.prototype.request.bind(context);
    Object.keys(Yaxios.prototype).forEach((key) => {
        instance[key] = Yaxios.prototype[key]
    })

    Object.keys(context).forEach((key) => {
        instance[key] = context[key];
    })
    return instance;
}

const yaxios = createInstance({method: 'GET', url: "http://localhost:3000/posts"});
yaxios.request({
    method: 'GET',
    url: 'http://localhost:3000/posts'
}).then((res) => {console.log(res);})