const config = {
    url: "URL_TO_SEND_REQ",
    // HTTP Method
    method: "get", // default is GET

    // baseURL will be prepended to URL unless URL is absolute
    // e.g baseURL = https://example.com/api, URL = posts
    // The URL will be https://example.com/api/posts
    baseURL: "BASE_URL",

    // transform request allows changes to the request data before sending to the server.
    // Only applicable for PUT/POST/PATCH/DELETE
    // it is a array containing functions.
    transformRequest: [
        (data, headers) => {
            // do something with the data and headers and return it.
            return data;
        }
    ],

    //transformResponse allows changes to before passing the response
    transformResponse: [
        (data) => {
            // do something with the data and return it
            return data;
        }
    ],

    // customize headers
    headers: {
      "customized_header_name": "customized_header_value"
    },

    // set params to be sent with the request
    // must be a plain object or a URLSearchParams object
    params: {
        "params_name": "params_value"
    },

    // Serializing paras
    paramsSerializer: (params) => {},

    // data to be sent with PUT/PATCH/POST
    data: {},

    // data in string form
    data: "data_here",

    // timeout specifies the number of MILLISECONDS before the request times out
    timeout: 10000,

    // indicates whether or not cross-site access-control requests should be made using credentials
    withCredentials: false, //default is false

    // adapters allows custom handling of requests
    // it is a function which returns a promise and supply a valid response
    adapter: () => {

    },

    //auth indicates that HTTP basic auth should be used and supplies credential
    // It will set an 'Authorization header, overwriting existing 'Authorization' header
    // Only HTTP basic auth is configurable through this parameter.
    // Bearer Token should use 'Authorization' custom headers instead.
    auth: {
        username: "janedoe",
        password: '1234567'
    },

    // `responseEncoding` indicates encoding to use for decoding responses (Node.js only)
    // Note: Ignored for `responseType` of 'stream' or client-side requests
    responseEncoding: 'utf8', // default

    // `xsrfCookieName` is the name of the cookie to use as a value for xsrf token
    xsrfCookieName: 'XSRF-TOKEN', // default

    // `xsrfHeaderName` is the name of the http header that carries the xsrf token value
    xsrfHeaderName: 'X-XSRF-TOKEN', // default

    // `onUploadProgress` allows handling of progress events for uploads
    // browser only
    onUploadProgress: function (progressEvent) {
        // Do whatever you want with the native progress event
    },

    // `onDownloadProgress` allows handling of progress events for downloads
    // browser only
    onDownloadProgress: function (progressEvent) {
        // Do whatever you want with the native progress event
    },

    // `maxContentLength` defines the max size of the http response content in bytes allowed in node.js
    maxContentLength: 2000,

    // `maxBodyLength` (Node only option) defines the max size of the http request content in bytes allowed
    maxBodyLength: 2000,

    // `validateStatus` defines whether to resolve or reject the promise for a given
    // HTTP response status code. If `validateStatus` returns `true` (or is set to `null`
    // or `undefined`), the promise will be resolved; otherwise, the promise will be
    // rejected.
    validateStatus: function (status) {
        return status >= 200 && status < 300; // default
    },

    // `maxRedirects` defines the maximum number of redirects to follow in node.js.
    // If set to 0, no redirects will be followed.
    maxRedirects: 5, // default

    // `socketPath` defines a UNIX Socket to be used in node.js.
    // e.g. '/var/run/docker.sock' to send requests to the docker daemon.
    // Only either `socketPath` or `proxy` can be specified.
    // If both are specified, `socketPath` is used.
    socketPath: null, // default

    // `httpAgent` and `httpsAgent` define a custom agent to be used when performing http
    // and https requests, respectively, in node.js. This allows options to be added like
    // `keepAlive` that are not enabled by default.
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),

    // `proxy` defines the hostname, port, and protocol of the proxy server.
    // You can also define your proxy using the conventional `http_proxy` and
    // `https_proxy` environment variables. If you are using environment variables
    // for your proxy configuration, you can also define a `no_proxy` environment
    // variable as a comma-separated list of domains that should not be proxied.
    // Use `false` to disable proxies, ignoring environment variables.
    // `auth` indicates that HTTP Basic auth should be used to connect to the proxy, and
    // supplies credentials.
    // This will set an `Proxy-Authorization` header, overwriting any existing
    // `Proxy-Authorization` custom headers you have set using `headers`.
    // If the proxy server uses HTTPS, then you must set the protocol to `https`.
    // socketPath has a higher priority than proxy
    proxy: {
        protocol: 'https',
        host: '127.0.0.1',
        port: 9000,
        auth: {
            username: 'mikeymike',
            password: 'rapunz3l'
        }
    },

    // `cancelToken` specifies a cancel token that can be used to cancel the request
    // (see Cancellation section below for details)
    cancelToken: new CancelToken(function (cancel) {
    }),

    // an alternative way to cancel Axios requests using AbortController
    signal: new AbortController().signal,
}