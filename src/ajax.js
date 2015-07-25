    function ajax(opts) {
        var defaults = {
            url: '',
            type: 'GET',
            async: true,
            data: undefined,
            contentType: undefined,
            before: function() {},
            loading: function() {},
            done: function() {},
            fail: function() {},
            always: function() {},
            xhr: function() {
                var request = new XMLHttpRequest();
                var that = this;
                request.open(this.type, this.url, this.async);
                if(this.type === 'GET') {
                    request.responseType = this.contentType;

                } else {
                    request.contentType = this.contentType;
                }

                request.onload = function() {
                    if(request.status === 200) {
                        that.done(request.response);
                    } else {
                        that.fail(request.response);
                    }
                    that.always(request.response);
                };
                request.addEventListener('progress', this.loading);
                this.before();

                return request;
            }
        };

        var options = {};

        options.url = opts.url || defaults.url;
        options.type = opts.type || defaults.type;
        options.data = opts.data || defaults.data;
        options.contentType = opts.contentType || defaults.contentType;
        options.responseType = opts.responseType || defaults.responseType;
        options.before = opts.before || defaults.before;
        options.loading = opts.loading || defaults.loading;
        options.done = opts.done || defaults.done;
        options.fail = opts.fail || defaults.fail;
        options.always = opts.always || defaults.always;
        options.async = opts.async || defaults.async;
        options.xhr = opts.xhr || defaults.xhr;

        var def = deferred();

        var currentXhr = options.xhr();
        var previousOnLoad = currentXhr.onload;
        currentXhr.onload = function() {
            if(currentXhr.status === 200) {
                def.resolve();
            } else {
                def.reject();
            }
            previousOnLoad();
        };

        currentXhr.send(options.data);

        return def.promise();
    }
