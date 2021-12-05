### How to create an yaxios instance from Yaxios
1. create a instance with default config using `createInstance`method.
  - Create a new Yaxios instance with defaultConfig
  - bind the Yaxios.prototype.request to this instance so that it can be uses as a function (instance = Yaxios.prototype.request)
  - extend Yaxios.prototype to the instance, so that all methods from Yaxios.prototype can be used by 
instance. Hence, instance.getUri, instance.post, instance.get, instance.delete e.t.c
  - extend contex to instance
```javascript
// ./yaxios.js
// Create the default instance to be exported
function createInstance(defaultConfig) {
    //创建一个实例对象 context
    var context = new Yaxios(defaultConfig);// context 不能当函数使用
    // 将 request 方法的 this 指向 context 并返回新函数  instance 可以用作函数使用, 且返回的是一个 promise 对象
    var instance = bind(Yaxios.prototype.request, context);// instance 与 Yaxios.prototype.request 代码一致

    // Copy yaxios.prototype to instance
    // 将 Yaxios.prototype 和实例对象的方法都添加到 instance 函数身上
    utils.extend(instance, Yaxios.prototype, context);// instance.get instance.post ...

    // 将实例对象的方法和属性扩展到 instance 函数身上
    utils.extend(instance, context);

    return instance;
}
/* ... */
var yaxios = createInstance(defaults);
// the default above is import from ./defaults
var defaults = require('./defaults');

```
2. Within the `createInstance` method, the default config from ./defaults.js
is added as the instanceConfig. The interceptors are set up using `InterceptorManager`
```javascript
// ./core/Yaxios.js
/**
 * Create a new instance of Yaxios
 * @param {Object} instanceConfig The default config for the instance
 */
function Yaxios(instanceConfig) {
    //attach instanceConfig to the instance
    this.defaults = instanceConfig;
    // Create Interceptors with InterceptorManage method
    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    };
}
```
3. Common methods are added to the prototype of Yaxios so that it can be called
through the instance.
```javascript
Yaxios.prototype.request = function request(config) {
    /* Set up request method */
}
Yaxios.prototype.getUri = function getUri(config) {
    /* Set up getUri method */
}

utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    /* provide aliases for supported request methods that does not contain data */
    /* so that you can use it as yaxios.get, yaxios.delet e.t.c */
    Yaxios.prototype[method] = function (url, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url
        }));
    };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /* provide aliases for supported request methods that contain data */
    /* so that you can use it as yaxios.post, yaxios.put, yaxios.patch with data */
    Yaxios.prototype[method] = function (url, data, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url,
            data: data
        }));
    };
});
```

### What does `Yaxios.prototype.request` actually do?
Below is the actual implementation of the request method.
```javascript
Yaxios.prototype.request = function request(config) {
    /*eslint no-param-reassign:0*/
    // Allow for yaxios('example/url'[, config]) a la fetch API
    /**
     * yaxios('http://www.baidu.com', {header:{}})
     */
    if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
    } else {
        config = config || {};
    }
    //merge the user-specified config with the default config
    config = mergeConfig(this.defaults, config);

    // Set config.method
    // 设定请求方法
    if (config.method) {
        config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
    } else {
        config.method = 'get';
    }

    // Hook up interceptors middleware
    // 创建拦截器中间件  第一个参数用来发送请求, 第二个为 undefined 用来补位
    var chain = [dispatchRequest, undefined];
    // 创建一个成功的 promise 且成功的值为合并后的请求配置
    var promise = Promise.resolve(config);//  promise 成功的Promise
    // 遍历实例对象的请求拦截器,
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        //将请求拦截器压入数组的最前面
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        //将相应拦截器压入数组的最尾部
        chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    //如果链条长度不为 0
    while (chain.length) {
        //依次取出 chain 的回调函数, 并执行
        promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
};
```
To break it down, first, `request` checks the config to see if it is string or a plain object. This allows usage like 
'example/url',[,config], in which case, the first element would be seen as the URL, while the following as the 
configs. Followed by this, user-specified config would be merged with default config. Note that if user-specified config
overlaps with default ones. They would be overwritten 'cause user configs have higher priorities.
```javascript
    // parse config
    if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
    } else {
        config = config || {};
    }
    //merge the user-specified config with the default config
    config = mergeConfig(this.defaults, config);
```
Second, after parsing the configs, the method would be set up accordingly. The logic is that user-specified config applies first,
followed by default config. If none was assigned, the default method is GET.
```javascript
    // Set config.method
    if (config.method) {
        config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
    } else {
        config.method = 'get';
    }
```
Thirdly, dispatch the request using `dispatchRequest`, the details of which will be discussed later,
create a Promise instance with config, the status of this Promise is 'fulfilled' since config is a plain 
object. After creating a Promise instance, request and response interceptors are also created using `unshiftRequestInterceptors`
and `pushResponseInterceptors`, we will discuss this later 'casue we haven't implemented interceptors yet.
```javascript
    // Hook up interceptors middleware
    // 创建拦截器中间件  第一个参数用来发送请求, 第二个为 undefined 用来补位
    var chain = [dispatchRequest, undefined];
    // 创建一个成功的 promise 且成功的值为合并后的请求配置
    var promise = Promise.resolve(config);//  promise 成功的Promise
    // 遍历实例对象的请求拦截器,
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        //将请求拦截器压入数组的最前面
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        //将相应拦截器压入数组的最尾部
        chain.push(interceptor.fulfilled, interceptor.rejected);
    });
```
Finally, the elements in chain are handled and request are sent via Promise
```javascript
    while (chain.length) {
        // Execute every function in the chaiN
        // The first to be executed is dispatchRequest, which would decide
        // whether or not the following get to be executed.
        promise = promise.then(chain.shift(), chain.shift());
    }

    return promise; // if the dispatch succeed, the retrned promise is the acutal response object. 
```

### So, how does `dispatchRequest` work anyway?
It starts by checking if the request is cancelled, it so, throw an error.
```javascript
    throwIfCancellationRequested(config);
```
Next, we tidy up headers. Ensure headers exist. So that we can do transformations if the user specified functions in transformRequest.
After that, the headers are merged with exising info and remove method-related ones because they are not needed when sending request
```javascript
    // Ensure headers exist 
    config.headers = config.headers || {};

    // do data transformation with functions in transformRequest
    // mostly skipped if the user does not set any.
    config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
    );

    // merge all header info
    config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
    );
    // remove method-related methods
    utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
            delete config.headers[method];
        }
    );
```
Now that we have headers ready, we get the adapter ready for sending requests. We have two adapters, XHR and HTTP and they
are the ones responsible for actually sending the requests. Adapters return Promise instance. If success, the response are parsed
by transformResponse, which by default, will jsonify the data if it is string.
```javascript
    // get the adapter, if is either XHR or HTTP
    var adapter = config.adapter || defaults.adapter;

    // Sending requests via the adapter and parsing the response.
    return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
            response.data,
            response.headers,
            config.transformResponse
        );
        // If succeed, return the transformed response.
        return response;
    }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
            throwIfCancellationRequested(config);

            // Transform response data
            if (reason && reason.response) {
                reason.response.data = transformData(
                    reason.response.data,
                    reason.response.headers,
                    config.transformResponse
                );
            }
        }
        // If failed, reject with error message.
        return Promise.reject(reason);
    });
```