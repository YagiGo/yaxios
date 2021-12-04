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
    console.log('request was called with type:', config.method);
}
Yaxios.prototype.get = (config) => {
    Yaxios.prototype.request({method: 'GET'});
}
Yaxios.prototype.post = (config) => {
    Yaxios.prototype.request({method: 'POST'});
}

const createInstance = (config) => {
    // create the context
    let context = new Yaxios(config);
    // bind the context with the request
    let instance = Yaxios.prototype.request.bind(context);
    // Instance is a function now, add other methods from Yaxios.prototype
    Object.keys(Yaxios.prototype).forEach((key) => {
        instance[key] = Yaxios.prototype[key].bind(context);
    })
    // bind context to instance
    Object.keys(context).forEach((key) => {
        instance[key] = context[key]
    })

    return instance;
}

// create a yaxios instance
const yaxios = createInstance({method: 'POST'});
yaxios.request({method: "DELETE"})
yaxios.post()
yaxios.get()
