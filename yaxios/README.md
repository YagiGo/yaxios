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

### How the interceptors are distributed and executed
After `dispatchRequest` and undefined are pushed into chain array, yaxios would handle interceptors if there is any.
When we write interceptors, we would write something like this:
```javascript
yaxios.interceptors.request.use((config) => {/*...*/}, (error) => {/*...*/});
yaxios.interceptors.response.use((config) => {/* ... */}, (error) => {/*...*/});
```
We already know that when creating an instance of the yaxios, we initialize interceptors like this 
```javascript
    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    };
```
so there are already request and response keys in the interceptors. As for how to add the interceptors, yaxios uses `use` that 
is implemented on the prototype of InterceptorManager.
```javascript
function InterceptorManager() {
    //创建一个属性
    this.handlers = [];
}

InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};
```
`use` is quite straightforward, it just pushes interceptor functions and error-handle functions into the handlers, which is 
just an empty array. There are two handlers, one for request interceptors and one for response interceptors.

That is all InterceptManager does, pushing functions into handlers for later use.

Now we go back to `Yaxios.prototype.request` where the interceptors are actually handled.
```javascript
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

The `forEach` is also implemented on the prototype of the `InterceptorManager`. An interceptor has two functions, 
`fulfilled` and `rejected`, `fulfilled` is the actual interceptor function and `rejected` is the error handle function.
Note that when we put request interceptors into the chain, we use `unshift` and when we put response interceptors into the chain,
we use `push`. The effect is that **The request interceptors are inserted in reverse, so the last request interceptor would be executed. But response interceptors
are inserted in sequence.** If we implement two request interceptors and two response interceptors, as follows:
```javascript
yaxios.interceptors.request.use((config) => {/*...*/}, (error) => {/*...*/}); // first req-interceptor
yaxios.interceptors.request.use((config) => {/*...*/}, (error) => {/*...*/}); // second req-interceptor

yaxios.interceptors.response.use((config) => {/* ... */}, (error) => {/*...*/}); // first res-interceptor
yaxios.interceptors.response.use((config) => {/* ... */}, (error) => {/*...*/}); // second res-interceptor
```
The now chain looks like this:
```javascript
const chatin = [
    two_req_interceptor_fn, two_req_error_handle_fn, 
    one_req_interceptor_fn, one_req_error_handle_fn,
    dispatchRequest, undefined,
    one_res_interceptor_fn, one_res_error_handle_fn,
    two_res_interceptor_fn, two_res_error_handle_fn
]
```
The chain is handled in pairs in `request`
```javascript
while (chain.length) {
    // Execute every function in the chaiN
    // The first to be executed is dispatchRequest, which would decide
    // whether or not the following get to be executed.
    promise = promise.then(chain.shift(), chain.shift());
}
```
The order of function executions is: req-interceptors->dispatchRequest->res-interceptors
This also explains why the undefined is needed in the chain, the `request` handles functions in pairs. So we need a placeholder as 
error-handler for dispatchRequest

### Now off we go, the cancellation
Cancellation and its implementation is actually my favorite as it demonstrates the possibility of Promise. The usage of cancellation is that 
you need to set up a cancellation function in your config
```javascript
cancelToken: new axios.CancelToken((c) =>{
  cancel = c
})
```
And when you want to cancel the request, just call `cancel`, which is the `c` in `axios.CancelToken`. So now we go to CancelToken.
```javascript
function CancelToken(executor) {
    // The executor is the the (c) => {cancel=c;}, which must be a function
    if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
    }

    //resolvePromise is just a resolve handler, when executed, the promise will become fulfilled from pending.
    var resolvePromise; //  resolvePromise()
    
    // now the resolvePromise is officially connected with resolve
    this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
    });
    // token 指向当前的实例对象
    var token = this;
    //as mentioned, (c)=>{cancel = c;} is the executor, so c is the function down below, which is then handed to cancel.
    executor(function cancel(message) {
        if (token.reason) {
            // Cancellation has already been requested
            return;
        }

        token.reason = new Cancel(message);
        resolvePromise(token.reason);
    });
}
```
The flow is that in `cancelToken`, we wrote a function `(c) => {cancel = c;}` and hand it to `CancelToken` as the executor.
`CancelToken` create a promise that is in `pending` state and put it in the `c` part of the executor, note that the promise can only be 
fulfilled when the `c` is called. In other world, when `cancel` is called, which is exactly what we did when clicking the button
```javascript
    btns[1].onclick = () => {
      cancel();
    }
```
`cancel` is called -> the promise is resolved so the promise is fulfilled.

But you may ask, OK, this is good and all, but how can this stop the request, it is not like it aborts the XHR or something, and you are 
totally right! To see how it stops the request, we need go to the XHR adapter.
```javascript
//如果配置了 cancelToken 则调用 then 方法设置成功的回调
if (config.cancelToken) {
    // Handle cancellation
    config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
            return;
        }
        //取消请求
        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
    });
}
```
As you can see here, this part of the code is called only when we set up the cancelToken in the config. As mentioned above, when calling `cancel`,
`resolvePromise` is called therefore, the promise is resolve. This promise can be accessed via the promise as it is bind to the instance.
So this part can be called and run 
```javascript
function onCanceled(cancel) {
        if (!request) {
            return;
        }
        //取消请求
        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
    }
```
And wool! request is aborted! The beauty of this implementation is that the request will not abort if you don't resolve the promise as it is on the pending
state, therefore the promise chain can not go on and as a result, the resolve function will not run.