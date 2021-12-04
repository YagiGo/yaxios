### How to create an axios instance from Axios
1. create a instance with default config using `createInstance`method.
  - Create a new Axios instance with defaultConfig
  - bind the Axios.prototype.request to this instance so that it can be uses as a function (instance = Axios.prototype.request)
  - extend Axios.prototype to the instance, so that all methods from Axios.prototype can be used by 
instance. Hence, instance.getUri, instance.post, instance.get, instance.delete e.t.c
  - extend contex to instance
```javascript
// ./axios.js
// Create the default instance to be exported
function createInstance(defaultConfig) {
    //创建一个实例对象 context
    var context = new Axios(defaultConfig);// context 不能当函数使用
    // 将 request 方法的 this 指向 context 并返回新函数  instance 可以用作函数使用, 且返回的是一个 promise 对象
    var instance = bind(Axios.prototype.request, context);// instance 与 Axios.prototype.request 代码一致

    // Copy axios.prototype to instance
    // 将 Axios.prototype 和实例对象的方法都添加到 instance 函数身上
    utils.extend(instance, Axios.prototype, context);// instance.get instance.post ...

    // 将实例对象的方法和属性扩展到 instance 函数身上
    utils.extend(instance, context);

    return instance;
}
/* ... */
var axios = createInstance(defaults);
// the default above is import from ./defaults
var defaults = require('./defaults');

```
2. Within the `createInstance` method, the default config from ./defaults.js
is added as the instanceConfig. The interceptors are set up using `InterceptorManager`
```javascript
// ./core/Axios.js
/**
 * Create a new instance of Axios
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
    //attach instanceConfig to the instance
    this.defaults = instanceConfig;
    // Create Interceptors with InterceptorManage method
    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    };
}
```
3. Common methods are added to the prototype of Axios so that it can be called
through the instance.
```javascript
Axios.prototype.request = function request(config) {
    /* Set up request method */
}
Axios.prototype.getUri = function getUri(config) {
    /* Set up getUri method */
}

utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    /* provide aliases for supported request methods that does not contain data */
    /* so that you can use it as axios.get, axios.delet e.t.c */
    Axios.prototype[method] = function (url, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url
        }));
    };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /* provide aliases for supported request methods that contain data */
    /* so that you can use it as axios.post, axios.put, axios.patch with data */
    Axios.prototype[method] = function (url, data, config) {
        return this.request(utils.merge(config || {}, {
            method: method,
            url: url,
            data: data
        }));
    };
});
```

