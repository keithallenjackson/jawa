/*global XMLHttpRequest, window, console
*/
(function(global) {
    'use strict';



    /* async.js
    */

    // deferreds for async operation
    function deferred() {

        var doneCallbacks = [],
        alwaysCallbacks = [],
        failCallbacks = [],
        _then = function() {},
        vals = [],
        state = 'pending';

        var reveal = {
            done: function(func) { doneCallbacks.push(func); return this; },
            always: function(func) { alwaysCallbacks.push(func); return this; },
            fail: function(func) { failCallbacks.push(func); return this; },
            resolve: function() {
                vals = Array.prototype.slice.apply(arguments);
                state = 'resolved';
                for(var i = 0; i < doneCallbacks.length; i++) {
                   doneCallbacks[i].apply(global, vals);
                }
                for(i = 0; i < alwaysCallbacks.length; i++) {
                   alwaysCallbacks[i].apply(global, vals);
                }
                _then.apply(global, vals);
                return this;
            },
            reject: function() {
                vals = Array.prototype.slice.apply(arguments);
                state = 'rejected';
                for(var i = 0; i < failCallbacks.length; i++) {
                   failCallbacks[i].apply(global, vals);
                }
                for(i = 0; i < alwaysCallbacks.length; i++) {
                   alwaysCallbacks[i].apply(global, vals);
                }
                _then.apply(global, vals);
                return this;
            },
            state: function() { return state; },
            isResolved: function() { return state === 'resolved'; },
            isRejected: function() { return state === 'rejected'; },
            'then': function(func) { _then = func; return this; },
            'get': function() { return vals; },
            'promise': function() {
                return {
                    'done': this.done,
                    'always': this.always,
                    'fail': this.fail,
                    'state': this.state,
                    'isResolve': this.isResolved,
                    'isRejected': this.isRejected,
                    'then': this.then,
                    'get': this.get,
                };
            }
       };

        return reveal;

    }

    deferred.isPromise = function(obj) {
        return (obj.hasOwnProperty('done') &&
                obj.hasOwnProperty('always') &&
                obj.hasOwnProperty('fail') &&
                obj.hasOwnProperty('state') &&
                obj.hasOwnProperty('isResolved') &&
                obj.hasOwnProperty('isRejected') &&
                obj.hasOwnProperty('then') &&
                obj.hasOwnProperty('get') &&
                obj.hasOwnProperty('states') );
    };

    deferred.isDeferred = function(obj) {
        return (obj.hasOwnProperty('done') &&
                obj.hasOwnProperty('always') &&
                obj.hasOwnProperty('fail') &&
                obj.hasOwnProperty('resolve') &&
                obj.hasOwnProperty('reject') &&
                obj.hasOwnProperty('state') &&
                obj.hasOwnProperty('isResolved') &&
                obj.hasOwnProperty('isRejected') &&
                obj.hasOwnProperty('then') &&
                obj.hasOwnProperty('get') &&
                obj.hasOwnProperty('promise') &&
                obj.hasOwnProperty('states') );
    };

    //wait for a list of promises, use api to control next step
    function when() {
        var promises = Array.prototype.slice.call(arguments);
        var api = deferred();
        var totalDone = 0;
        var hasFailed = false;

        //calls function when a promise finishes
        function promiseDone() {
            totalDone++;
            checkIfReady();
        }

        function getValsFromPromises() {
            var vals = [];
            var index = 0;

            for(index; index < promises.length; index++) {
                if(deferred.isPromise(promises[index])) {
                    vals.push.apply(vals, promises[index].get());
                } else {
                    vals.push(undefined);
                }
            }

            return vals;
        }

        function checkIfReady() {
            var vals;
            if(totalDone >= promises.length) {
                //all promises have resolved, time to move forward
                vals = getValsFromPromises();
                if(hasFailed) {
                   api.reject.apply(global, vals);
                } else {
                   api.resolve.apply(global, vals);
                }
            }
        }

        var fail = function() { hasFailed = true; };

        for(var i = 0; i < promises.length; i++) {
            var isPromise = deferred.isPromise(promises[i]);

            if(!isPromise || promises[i].isResolved()) {
                totalDone++;
            } else if(promises[i].isRejected()) {
                totalDone++;
                hasFailed = true;
            } else {
               promises[i].always(promiseDone);
                promises[i].fail(fail);
            }
        }

        //check if all promises are resolved asyncronously to allow api to be
        //revealed which in turn allows users to subscribe to events
        if(totalDone >= promises.length) {
            global.setTimeout(checkIfReady, 0);
        }

        //return the new promise for subscription
        return api.promise();
    }

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

    var jawa = function(input) {
        var node = Object.create(fn),
            options = {},
            def = deferred();

        node._source = context.createBufferSource();


        jawa.load(input).done(function(buffer) {
            node._source.buffer = buffer;
            def.resolve(node);
        }).fail(function(error) {
            console.log(error);
            throw "Error in loading audio";
        });

        return def.promise();
    };

    var fn = jawa.fn = {
        play: function() {
            this._source.connect(context.destination);
            this._source.start(0);
            return this;
        },
        stop: function() {
            this._source.disconnect(context.destination);
            this._source.stop();
        },
        pause: function() {
        },
        volume: function(level) {
        },
        pan: function(level) {
        },
        rewind: function(ms) {
        },
        fastForward: function(ms) {
        }
    };


    jawa.extend = fn.extend = function() {
        var source = arguments[0],
            target = arguments[1] ? arguments[1] :
                     this === global ? fn : this;

        if(!source && !(typeof source === 'object' || typeof source === 'function') ) {
            return;
        }

        for(var prop in source) {
            target[prop] = source[prop];
        }

    };







    var WebAudio = global.AudioContext || global.webkitAudioContext;

    var context = jawa.ctx = new WebAudio();
    var loadAudio = jawa.load = function loadAudio(url) {
        var def = deferred();

        ajax({
            type: 'GET',
            async: true,
            url: url,
            contentType: 'arraybuffer',
            before: function() {
                global.console.log('Loading ' + url);
            },
            loading: function(e) {
                if(e.lengthComputable) {
                    global.console.log(e.loaded / e.total * 100 + "%");
                }
            },
            done: function(val) {
                context.decodeAudioData(val, function(buffer) {
                    def.resolve(buffer);
                });
            },
            fail: function(val) {
                def.reject(val);
            }
        });

        return def.promise();
    };

    function playSound(buffer) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
    }


    global.jawa = jawa;


})(typeof window !== 'undefined' ? window : this);
