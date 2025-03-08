// handling the http requests
function ApiService(token) {
    this.token = token;

    this.fetch = function(url, options) {
        options = options || {};
        
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();

            var method = options.method || 'GET';
            xhr.open(method, url, true);

            xhr.setRequestHeader("Authorization", this.token);
            xhr.setRequestHeader("Content-Type", "application/json");

            if (options.headers) {
                for (var header in options.headers) {
                    if (options.headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, options.headers[header]);
                    }
                }
            }

            xhr.onload = function() {
                var response = {
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    json: function() {
                        return new Promise(function(resolve, reject) {
                            try {
                                resolve(JSON.parse(xhr.responseText));
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }
                };
                resolve(response);
            };

            xhr.onerror = function() {
                reject(new Error("Network error"));
            };

            if (options.body) {
                xhr.send(options.body);
            } else {
                xhr.send();
            }
        }.bind(this));
    };
}