
(function() {


    if (!Array.prototype.includes) {
        Array.prototype.includes = function (element, fromIndex) {
            fromIndex = fromIndex || 0;
            for (var i = fromIndex; i < this.length; i++) {
                if (this[i] === element) {
                    return true;
                }
            }
            return false;
        };
    }

    if (!Array.prototype.map) {
        //callback(eachItem, index, array)   
        Array.prototype.map = function (callback) {
            var arr = [];
            try {
                for (var i = 0; i < this.length; i++) {
                    arr.push(callback(this[i], i, this));
                }
            } catch (e) {
                throw new Error(e);
            }
            return arr;
        }
    }

    /*
    2. Polyfill for Array filter method
    var arr = [1,2,3];
    var newArr = arr.filter((item) => item > 1);
    console.log(newArr); // [2,3]
    console.log(arr === newArr) // false
    */
    if (!Array.prototype.filter) {
        //callback(eachItem, index, array)       
        Array.prototype.filter = function (callback) {
            var arr = [];
            try {
                for (var i = 0; i < this.length; i++) {
                    if (callback(this[i], i, this)) {
                        arr.push(this[i]);
                    }
                }
            } catch (e) {
                throw new Error(e);
            }
            return arr;
        }
    }
    /*
    3. Ployfill for Array forEach method
    Polyfill for Array filter method
    var arr = [1,2,3];
    var val = arr.forEach((item) => console.log(item));
    console.log(val); // undefined
    */
    if (!Array.prototype.forEach) {
        //callback(eachItem, index, array)
        Array.prototype.forEach = function (callback) {
            try {
                for (var i = 0; i < this.length; i++) {
                    callback(this[i], i, this);
                }
            } catch (e) {
                throw new Error(e);
            }
        }
    }
    /*
    4. Polyfill for Array reverse method
    var arr = [1,2,3];
    var val = arr.reverse();
    console.log(val) // [3,2,1]
    console.log(val === arr) // true
    */
    if (!Array.prototype.reverse) {
        Array.prototype.reverse = function () {
            var arr = [];
            try {
                for (var i = this.length - 1; i >= 0; i--) {
                    arr.push(this[i]);
                }
            } catch (e) {
                throw new Error(e);
            }
            return arr;
        }
    }
    /*
    5. Polyfill for Array reduce method
    */
    if (!Array.prototype.reduce) {
        //callback(prevVal, eachItem, index, array)
        Array.prototype.reduce = function (callback, prevVal) {
            try {
                for (var i = 0; i < this.length; i++) {
                    prevVal = callback(prevVal, this[i], i, this);
                }
                return prevVal;
            } catch (e) {
                throw new Error(e);
            }
        }
    }

    if(!Array.prototype.flat) {
        Array.prototype.flat = function(depth) {
            var flattend = [];
            (function flat(arr, depth) {
                for (var i = 0; i < arr.length; i++) {
                    if (Array.isArray(arr[i]) && depth > 0) {
                        flat(arr[i], depth - 1);
                    } else {
                        flattend.push(arr[i]);
                    }
                }
            })(this, Math.floor(depth) || 1);
            return flattend;
        };
    }

    if(String.prototype.startsWith === undefined) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.substring(position, searchString.length) === searchString;
        };
    }

    if(!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
            if (typeof start !== 'number') {
                start = 0;
            }
            
            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        };
    }

    if (!NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    if (!Array.from) {
        Array.from = function (obj) {
            return [].slice.call(obj);
        }
    }

    function addDefaultForWebkitFunctions(prototype) {
        var ref = prototype;
        for(var fnIndex in prototype) {
            var fnName = fnIndex;
            if(fnIndex.startsWith("webkit")) {
                fnName = fnIndex.replace("webkit", "");
                var firstChar = fnName.charAt(0).toLowerCase();
                fnName = firstChar + fnName.slice(1);
                try {
                    if(typeof prototype[fnName] == "undefined") {
                        if(typeof prototype[fnIndex] === "function") {
                            prototype[fnName] = prototype[fnIndex];
                        } else {
                            (function(originalProperty, newPropertyName) {
                                Object.defineProperty(prototype, fnName, {
                                    get: function() {
                                        return this[originalProperty];
                                    },
                                    set: function(value) {
                                        this[originalProperty] = value;
                                    }
                                });
                            })(fnIndex, fnName);
                        }                
                    }
                } catch(e) {
                    continue;
                }
            }
        }
    }


    addDefaultForWebkitFunctions(window);
    addDefaultForWebkitFunctions(document);

    

    var domPrototypes = [Element.prototype, Document.prototype, DocumentFragment.prototype];
    for (var prototypeIndex in domPrototypes) {
        var prototype = domPrototypes[prototypeIndex];

        addDefaultForWebkitFunctions(prototype);
        if (!prototype.before) {
            prototype.before = function () {
                var argArr = Array.prototype.slice.call(arguments),
                    docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.parentNode.insertBefore(docFrag, this);
            }
        }

        if (!prototype.insertBefore) {
            prototype.insertBefore = function (newNode, referenceNode) {
                referenceNode.before(newNode);
            }
        }

        if (!prototype.prepend) {
            prototype.prepend = function () {
                var ref = this;
                var args = Array.prototype.slice.call(arguments);
                args.forEach(function (arg) {
                    if (typeof arg === 'string') {
                        arg = document.createTextNode(arg);
                    }
                    ref.insertBefore(arg, ref.firstChild);
                });
            };
        }

        if (!prototype.append) {
            prototype.append = function () {
                var ref = this;
                var args = Array.prototype.slice.call(arguments);
                args.forEach(function (arg) {
                    if (typeof arg === 'string') {
                        arg = document.createTextNode(arg);
                    }
                    ref.appendChild(arg);
                });
            };
        }

        if (!prototype.remove) {
            prototype.remove = function () {
                this.parentElement.removeChild(this);
            };
        }

        try {
            if (!prototype.firstElementChild) {
                Object.defineProperty(prototype, 'firstElementChild', {
                    get: function () {
                        var el = this.firstChild;
                        while (el && el.nodeType !== 1) {
                            el = el.nextSibling;
                        }
                        return el;
                    }
                });
            }

            if (!prototype.lastElementChild) {
                Object.defineProperty(prototype, 'lastElementChild', {
                    get: function () {
                        var el = this.lastChild;
                        while (el && el.nodeType !== 1) {
                            el = el.previousSibling;
                        }
                        return el;
                    }
                });
            }
        } catch (e) {
            
        }
    }




})();

window.Promise = (function () {
    'use strict';

    /**
     * @this {Promise}
     */
    function finallyConstructor(callback) {
        var constructor = this.constructor;
        return this.then(
            function (value) {
                // @ts-ignore
                return constructor.resolve(callback()).then(function () {
                    return value;
                });
            },
            function (reason) {
                // @ts-ignore
                return constructor.resolve(callback()).then(function () {
                    // @ts-ignore
                    return constructor.reject(reason);
                });
            }
        );
    }

    function allSettled(arr) {
        var P = this;
        return new P(function (resolve, reject) {
            if (!(arr && typeof arr.length !== 'undefined')) {
                return reject(
                    new TypeError(
                        typeof arr +
                        ' ' +
                        arr +
                        ' is not iterable(cannot read property Symbol(Symbol.iterator))'
                    )
                );
            }
            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                if (val && (typeof val === 'object' || typeof val === 'function')) {
                    var then = val.then;
                    if (typeof then === 'function') {
                        then.call(
                            val,
                            function (val) {
                                res(i, val);
                            },
                            function (e) {
                                args[i] = { status: 'rejected', reason: e };
                                if (--remaining === 0) {
                                    resolve(args);
                                }
                            }
                        );
                        return;
                    }
                }
                args[i] = { status: 'fulfilled', value: val };
                if (--remaining === 0) {
                    resolve(args);
                }
            }

            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    }

    /**
     * @constructor
     */
    function AggregateError(errors, message) {
        this.name = 'AggregateError', this.errors = errors;
        this.message = message || '';
    }
    AggregateError.prototype = Error.prototype;

    function any(arr) {
        var P = this;
        return new P(function (resolve, reject) {
            if (!(arr && typeof arr.length !== 'undefined')) {
                return reject(new TypeError('Promise.any accepts an array'));
            }

            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return reject();

            var rejectionReasons = [];
            for (var i = 0; i < args.length; i++) {
                try {
                    P.resolve(args[i])
                        .then(resolve)
                        .catch(function (error) {
                            rejectionReasons.push(error);
                            if (rejectionReasons.length === args.length) {
                                reject(
                                    new AggregateError(
                                        rejectionReasons,
                                        'All promises were rejected'
                                    )
                                );
                            }
                        });
                } catch (ex) {
                    reject(ex);
                }
            }
        });
    }

    // Store setTimeout reference so promise-polyfill will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var setTimeoutFunc = setTimeout;

    function isArray(x) {
        return Boolean(x && typeof x.length !== 'undefined');
    }

    function noop() { }

    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function () {
            fn.apply(thisArg, arguments);
        };
    }

    /**
     * @constructor
     * @param {Function} fn
     */
    function Promise(fn) {
        if (!(this instanceof Promise))
            throw new TypeError('Promises must be constructed via new');
        if (typeof fn !== 'function') throw new TypeError('not a function');
        /** @type {!number} */
        this._state = 0;
        /** @type {!boolean} */
        this._handled = false;
        /** @type {Promise|undefined} */
        this._value = undefined;
        /** @type {!Array<!Function>} */
        this._deferreds = [];

        doResolve(fn, this);
    }

    function handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }
        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }
        self._handled = true;
        Promise._immediateFn(function () {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
                return;
            }
            var ret;
            try {
                ret = cb(self._value);
            } catch (e) {
                reject(deferred.promise, e);
                return;
            }
            resolve(deferred.promise, ret);
        });
    }

    function resolve(self, newValue) {
        try {
            // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === self)
                throw new TypeError('A promise cannot be resolved with itself.');
            if (
                newValue &&
                (typeof newValue === 'object' || typeof newValue === 'function')
            ) {
                var then = newValue.then;
                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === 'function') {
                    doResolve(bind(then, newValue), self);
                    return;
                }
            }
            self._state = 1;
            self._value = newValue;
            finale(self);
        } catch (e) {
            reject(self, e);
        }
    }

    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }

    function finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
            Promise._immediateFn(function () {
                if (!self._handled) {
                    Promise._unhandledRejectionFn(self._value);
                }
            });
        }

        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }

    /**
     * @constructor
     */
    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.promise = promise;
    }

    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
        var done = false;
        try {
            fn(
                function (value) {
                    if (done) return;
                    done = true;
                    resolve(self, value);
                },
                function (reason) {
                    if (done) return;
                    done = true;
                    reject(self, reason);
                }
            );
        } catch (ex) {
            if (done) return;
            done = true;
            reject(self, ex);
        }
    }

    Promise.prototype['catch'] = function (onRejected) {
        return this.then(null, onRejected);
    };

    Promise.prototype.then = function (onFulfilled, onRejected) {
        // @ts-ignore
        var prom = new this.constructor(noop);

        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };

    Promise.prototype['finally'] = finallyConstructor;

    Promise.all = function (arr) {
        return new Promise(function (resolve, reject) {
            if (!isArray(arr)) {
                return reject(new TypeError('Promise.all accepts an array'));
            }

            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(
                                val,
                                function (val) {
                                    res(i, val);
                                },
                                reject
                            );
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }

            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };

    Promise.any = any;

    Promise.allSettled = allSettled;

    Promise.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }

        return new Promise(function (resolve) {
            resolve(value);
        });
    };

    Promise.reject = function (value) {
        return new Promise(function (resolve, reject) {
            reject(value);
        });
    };

    Promise.race = function (arr) {
        return new Promise(function (resolve, reject) {
            if (!isArray(arr)) {
                return reject(new TypeError('Promise.race accepts an array'));
            }

            for (var i = 0, len = arr.length; i < len; i++) {
                Promise.resolve(arr[i]).then(resolve, reject);
            }
        });
    };

    // Use polyfill for setImmediate for performance gains
    Promise._immediateFn =
        // @ts-ignore
        (typeof setImmediate === 'function' &&
            function (fn) {
                // @ts-ignore
                setImmediate(fn);
            }) ||
        function (fn) {
            setTimeoutFunc(fn, 0);
        };

    Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
        if (typeof console !== 'undefined' && console) {
            if(err && err.stack) {
                console.error(err);
                console.error(err.stack);
            }  
            console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
        }
    };

    return Promise;
})();

(function () {
    'use strict';

    if (self.fetch) {
        return
    }

    function normalizeName(name) {
        if (typeof name !== 'string') {
            name = name.toString();
        }
        if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
            throw new TypeError('Invalid character in header field name')
        }
        return name.toLowerCase()
    }

    function normalizeValue(value) {
        if (typeof value !== 'string') {
            value = value.toString();
        }
        return value
    }

    function Headers(headers) {
        this.map = {}

        var self = this
        if (headers instanceof Headers) {
            headers.forEach(function (name, values) {
                values.forEach(function (value) {
                    self.append(name, value)
                })
            })

        } else if (headers) {
            Object.getOwnPropertyNames(headers).forEach(function (name) {
                self.append(name, headers[name])
            })
        }
    }

    Headers.prototype.append = function (name, value) {
        name = normalizeName(name)
        value = normalizeValue(value)
        var list = this.map[name]
        if (!list) {
            list = []
            this.map[name] = list
        }
        list.push(value)
    }

    Headers.prototype['delete'] = function (name) {
        delete this.map[normalizeName(name)]
    }

    Headers.prototype.get = function (name) {
        var values = this.map[normalizeName(name)]
        return values ? values[0] : null
    }

    Headers.prototype.getAll = function (name) {
        return this.map[normalizeName(name)] || []
    }

    Headers.prototype.has = function (name) {
        return this.map.hasOwnProperty(normalizeName(name))
    }

    Headers.prototype.set = function (name, value) {
        this.map[normalizeName(name)] = [normalizeValue(value)]
    }

    // Instead of iterable for now.
    Headers.prototype.forEach = function (callback) {
        var self = this
        Object.getOwnPropertyNames(this.map).forEach(function (name) {
            callback(name, self.map[name])
        })
    }

    function consumed(body) {
        if (body.bodyUsed) {
            return fetch.Promise.reject(new TypeError('Already read'))
        }
        body.bodyUsed = true
    }

    function fileReaderReady(reader) {
        return new fetch.Promise(function (resolve, reject) {
            reader.onload = function () {
                resolve(reader.result)
            }
            reader.onerror = function () {
                reject(reader.error)
            }
        })
    }

    function readBlobAsArrayBuffer(blob) {
        var reader = new FileReader()
        reader.readAsArrayBuffer(blob)
        return fileReaderReady(reader)
    }

    function readBlobAsText(blob) {
        var reader = new FileReader()
        reader.readAsText(blob)
        return fileReaderReady(reader)
    }

    var support = {
        blob: 'FileReader' in self && 'Blob' in self && (function () {
            try {
                new Blob();
                return true
            } catch (e) {
                return false
            }
        })(),
        formData: 'FormData' in self
    }

    function Body() {
        this.bodyUsed = false


        this._initBody = function (body) {
            this._bodyInit = body
            if (typeof body === 'string') {
                this._bodyText = body
            } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                this._bodyBlob = body
            } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                this._bodyFormData = body
            } else if (!body) {
                this._bodyText = ''
            } else {
                throw new Error('unsupported BodyInit type')
            }
        }

        if (support.blob) {
            this.blob = function () {
                var rejected = consumed(this)
                if (rejected) {
                    return rejected
                }

                if (this._bodyBlob) {
                    return fetch.Promise.resolve(this._bodyBlob)
                } else if (this._bodyFormData) {
                    throw new Error('could not read FormData body as blob')
                } else {
                    return fetch.Promise.resolve(new Blob([this._bodyText]))
                }
            }

            this.arrayBuffer = function () {
                return this.blob().then(readBlobAsArrayBuffer)
            }

            this.text = function () {
                var rejected = consumed(this)
                if (rejected) {
                    return rejected
                }

                if (this._bodyBlob) {
                    return readBlobAsText(this._bodyBlob)
                } else if (this._bodyFormData) {
                    throw new Error('could not read FormData body as text')
                } else {
                    return fetch.Promise.resolve(this._bodyText)
                }
            }
        } else {
            this.text = function () {
                var rejected = consumed(this)
                return rejected ? rejected : fetch.Promise.resolve(this._bodyText)
            }
        }

        if (support.formData) {
            this.formData = function () {
                return this.text().then(decode)
            }
        }

        this.json = function () {
            return this.text().then(function (text) {
                return JSON.parse(text);
            });
        }

        return this
    }

    // HTTP methods whose capitalization should be normalized
    var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

    function normalizeMethod(method) {
        var upcased = method.toUpperCase()
        return (methods.indexOf(upcased) > -1) ? upcased : method
    }

    function Request(url, options) {
        options = options || {}
        this.url = url

        this.credentials = options.credentials || 'omit'
        this.headers = new Headers(options.headers)
        this.method = normalizeMethod(options.method || 'GET')
        this.mode = options.mode || null
        this.referrer = null

        if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
            throw new TypeError('Body not allowed for GET or HEAD requests')
        }
        this._initBody(options.body)
    }

    function decode(body) {
        var form = new FormData()
        body.trim().split('&').forEach(function (bytes) {
            if (bytes) {
                var split = bytes.split('=')
                var name = split.shift().replace(/\+/g, ' ')
                var value = split.join('=').replace(/\+/g, ' ')
                form.append(decodeURIComponent(name), decodeURIComponent(value))
            }
        })
        return form
    }

    function headers(xhr) {
        var head = new Headers()
        var pairs = xhr.getAllResponseHeaders().trim().split('\n')
        pairs.forEach(function (header) {
            var split = header.trim().split(':')
            var key = split.shift().trim()
            var value = split.join(':').trim()
            head.append(key, value)
        })
        return head
    }

    var noXhrPatch =
        typeof window !== 'undefined' && !!window.ActiveXObject &&
        !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

    function getXhr() {
        // from backbone.js 1.1.2
        // https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L1181
        if (noXhrPatch && !(/^(get|post|head|put|delete|options)$/i.test(this.method))) {
            this.usingActiveXhr = true;
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        return new XMLHttpRequest();
    }

    Body.call(Request.prototype)

    function Response(bodyInit, options) {
        if (!options) {
            options = {}
        }

        this._initBody(bodyInit)
        this.type = 'default'
        this.url = null
        this.status = options.status
        this.ok = this.status >= 200 && this.status < 300
        this.statusText = options.statusText
        this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
        this.url = options.url || ''
    }

    Body.call(Response.prototype)

    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;

    self.fetch = function (input, init) {
        // TODO: Request constructor should accept input, init
        var request
        if (Request.prototype.isPrototypeOf(input) && !init) {
            request = input
        } else {
            request = new Request(input, init)
        }

        return new fetch.Promise(function (resolve, reject) {
            var xhr = getXhr();
            if (request.credentials === 'cors') {
                xhr.withCredentials = true;
            }

            function responseURL() {
                if ('responseURL' in xhr) {
                    return xhr.responseURL
                }

                // Avoid security warnings on getResponseHeader when not allowed by CORS
                if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
                    return xhr.getResponseHeader('X-Request-URL')
                }

                return;
            }

            function onload() {
                if (xhr.readyState !== 4) {
                    return
                }
                var status = (xhr.status === 1223) ? 204 : xhr.status
                if (status < 100 || status > 599) {
                    reject(new TypeError('Network request failed'))
                    return
                }
                var options = {
                    status: status,
                    statusText: xhr.statusText,
                    headers: headers(xhr),
                    url: responseURL()
                }
                var body = 'response' in xhr ? xhr.response : xhr.responseText;
                resolve(new Response(body, options))
            }
            xhr.onreadystatechange = onload;
            if (!self.usingActiveXhr) {
                xhr.onload = onload;
                xhr.onerror = function () {
                    reject(new TypeError('Network request failed'))
                }
            }

            xhr.open(request.method, request.url, true)

            if ('responseType' in xhr && support.blob) {
                xhr.responseType = 'blob'
            }

            request.headers.forEach(function (name, values) {
                values.forEach(function (value) {
                    xhr.setRequestHeader(name, value)
                })
            })

            xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
        })
    }
    fetch.Promise = self.Promise; // you could change it to your favorite alternative
    self.fetch.polyfill = true
})();



/*!
 * css-var-polyfill.js - v1.2
 *
 * Copyright (c) 2019 Aaron Barker <http://aaronbarker.net>
 * Released under the MIT license
 *
 * Date: 2021-03-19
 */
var cssVarPoly = {
    init: function() {
      // first lets see if the browser supports CSS variables
      // No version of IE supports window.CSS.supports, so if that isn't supported in the first place we know CSS variables is not supported
      // Edge supports supports, so check for actual variable support
    //   if (window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)') || false) {
    //     // this browser does support variables, abort
    //     console.log('your browser supports CSS variables, aborting and letting the native support handle things.');
    //     return;
    //   } else {
    //     // edge barfs on console statements if the console is not open... lame!
    //     console.log('no support for you! polyfill all (some of) the things!!');
    //     document.querySelector('body').classList.add('cssvars-polyfilled');
    //   }
  
      cssVarPoly.ratifiedVars = {};
      cssVarPoly.varsByBlock = {};
      cssVarPoly.oldCSS = {};
  
      // start things off
      cssVarPoly.findCSS();
      cssVarPoly.updateCSS();
    },
  
    // find all the css blocks, save off the content, and look for variables
    findCSS: function() {
      var styleBlocks = document.querySelectorAll('style:not(.inserted)[polyfill],link[rel="stylesheet"][polyfill],link[rel="import"][polyfill]');
  
      // we need to track the order of the style/link elements when we save off the CSS, set a counter
      var counter = 1;
  
      // loop through all CSS blocks looking for CSS variables being set
      [].forEach.call(styleBlocks, function(block) {
        // console.log(block.nodeName);
        var theCSS;
        if (block.nodeName === 'STYLE') {
          // console.log("style");
          theCSS = block.innerHTML;
          cssVarPoly.findSetters(theCSS, counter);
        } else if (block.nodeName === 'LINK') {
          // console.log("link");
          cssVarPoly.getLink(block.getAttribute('href'), counter, function(counter, request) {
            cssVarPoly.findSetters(request.responseText, counter);
            cssVarPoly.oldCSS[counter] = request.responseText;
            cssVarPoly.updateCSS();
          });
          theCSS = '';
        }
        // save off the CSS to parse through again later. the value may be empty for links that are waiting for their ajax return, but this will maintain the order
        cssVarPoly.oldCSS[counter] = theCSS;
        counter++;
      });
    },
  
    // find all the "--variable: value" matches in a provided block of CSS and add them to the master list
    findSetters: function(theCSS, counter) {
      // console.log(theCSS);
      // tests for the following at https://regex101.com/r/kWwUmp/3
      cssVarPoly.varsByBlock[counter] = theCSS.match(/(--[\w-]+:[\s]*[^;\n}]+)/g) || [];
    },
  
    // run through all the CSS blocks to update the variables and then inject on the page
    updateCSS: function() {
      // first lets loop through all the variables to make sure later vars trump earlier vars
      cssVarPoly.ratifySetters(cssVarPoly.varsByBlock);
  
      // loop through the css blocks (styles and links)
      for (var curCSSID in cssVarPoly.oldCSS) {
        // console.log("curCSS:", cssVarPoly.oldCSS[curCSSID]);
        var newCSS = cssVarPoly.replaceGetters(cssVarPoly.oldCSS[curCSSID], cssVarPoly.ratifiedVars);
        // put it back into the page
        // first check to see if this block exists already
        if (document.querySelector('#inserted' + curCSSID)) {
          // console.log("updating")
          document.querySelector('#inserted' + curCSSID).innerHTML = newCSS;
        } else {
          // console.log("adding");
          var style = document.createElement('style');
          style.type = 'text/css';
          style.innerHTML = newCSS;
          style.classList.add('inserted');
          style.id = 'inserted' + curCSSID;
          document.getElementsByTagName('head')[0].appendChild(style);
        }
      };
    },
  
    // parse a provided block of CSS looking for a provided list of variables and replace the --var-name with the correct value
    replaceGetters: function(curCSS, varList) {
      // console.log(varList);
      for (var theVar in varList) {
        // console.log(theVar);
        // match the variable with the actual variable name
        var getterRegex = new RegExp('var\\(\\s*' + theVar + '\\s*\\)', 'g');
        // console.log(getterRegex);
        // console.log(curCSS);
        curCSS = curCSS.replace(getterRegex, varList[theVar]);
  
        // now check for any getters that are left that have fallbacks
        var getterRegex2 = new RegExp('var\\([^\\)]+,\\s*([^\\)]+)\\)', 'g');
        // console.log(getterRegex);
        // console.log(curCSS);
        var matches = curCSS.match(getterRegex2);
        if (matches) {
          // console.log("matches",matches);
          matches.forEach(function(match) {
            // console.log(match.match(/var\(.+,\s*(.+)\)/))
            // find the fallback within the getter
            curCSS = curCSS.replace(match, match.match(/var\([^\)]+,\s*([^\)]+)\)/)[1]);
          });
  
        }
  
        // curCSS = curCSS.replace(getterRegex2,varList[theVar]);
      };
      // console.log(curCSS);
      return curCSS;
    },
  
    // determine the css variable name value pair and track the latest
    ratifySetters: function(varList) {
      // console.log("varList:",varList);
      // loop through each block in order, to maintain order specificity
      for (var curBlock in varList) {
        var curVars = varList[curBlock];
        // console.log("curVars:",curVars);
        // loop through each var in the block
        curVars.forEach(function(theVar) {
          // console.log(theVar);
          // split on the name value pair separator
          var matches = theVar.split(/:\s*/);
          // console.log(matches);
          // put it in an object based on the varName. Each time we do this it will override a previous use and so will always have the last set be the winner
          // 0 = the name, 1 = the value, strip off the ; if it is there
          cssVarPoly.ratifiedVars[matches[0]] = matches[1].replace(/;/, '');
        });
      };
      // console.log(cssVarPoly.ratifiedVars);
    },
  
    // get the CSS file (same domain for now)
    getLink: function(url, counter, success) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.overrideMimeType('text/css;');
      request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
          // Success!
          // console.log(request.responseText);
          if (typeof success === 'function') {
            success(counter, request);
          }
        } else {
          // We reached our target server, but it returned an error
          console.warn('an error was returned from:', url);
        }
      };
  
      request.onerror = function() {
        // There was a connection error of some sort
        console.warn('we could not get anything from:', url);
      };
  
      request.send();
    }
  };
  
  cssVarPoly.init();