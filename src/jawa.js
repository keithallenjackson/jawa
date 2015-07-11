(function(global) {
    'use strict';
    
    var deferredApi = {
       resolve: function() {
            this._vals = Array.prototype.slice.apply(arguments);
            this.state = this.states.resolved;
            for(var i = 0; i < this.doneCallbacks.length; i++) {
               this.doneCallbacks[i].apply(global, this._vals);
            }
            for(i = 0; i < this.alwaysCallbacks.length; i++) {
               this.alwaysCallbacks[i].apply(global, this._vals);
            }
            this._then.apply(global, this._vals);
            
        },
        reject: function() {
            this._vals = Array.prototype.slice.apply(arguments);
           this.state = this.states.rejected;
            for(var i = 0; i < this.failCallbacks.length; i++) {
               this.failCallbacks[i].apply(global, this._vals);
           }
            for(i = 0; i < this.alwaysCallbacks.length; i++) {
               this.alwaysCallbacks[i].apply(global, this._vals);
           }
            this._then.apply(global, this._vals);
        },
        done: function(func) {
           this.doneCallbacks.push(func);
       },
        always: function(func) {
         this.alwaysCallbacks.push(func);
        },
        fail: function(func) {
           this.failCallbacks.push(func);
        },
        isResolved: function() { return this.state === this.states.resolved; },
        isRejected: function() { return this.state === this.states.rejected; },
        'then': function(func) {
            this._then = func;
        },
        get: function() { return this._vals; },
        states: {
           pending: 'pending',
            resolved: 'resolved',
            rejected: 'rejected'
        }
    };
    
    
    var jawa = function() {
        var base = Object.create(jawaPrototype);
        var fx = 'asdfsdf';
    };
    
    var jawaPrototype = jawa.fn = {
        play: function() {
             
        },
        stop: function() {
            
        },
        pause: function() {
            
        },
        rewind: function(ms) {
            
        },
        fastForward: function(ms) {
            
        },
        volume: function() {
            
        }
    };
    
    var fxPrototype = jawa.fx = Object.create(jawaPrototype);
    jawa.extend = jawaPrototype.extend = function() {
        if(typeof arguments[0] !== 'undefined' && typeof arguments[0] === 'undefined')
            return;
    };
    
    
    
    
        
    var WebAudio = global.AudioContext || global.webkitAudioContext;
    
    var context = new WebAudio();
    loadAudio('test.mp3').done(function(buffer) {
        playSound(buffer);
    });
    
    function loadAudio(url) {
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
    }
    
    function playSound(buffer) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
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
    
    
    
    /* async.js
    */
    
    

    // deferreds for async operation
    function deferred() {
        var _deferred = Object.create(deferredApi);
        _deferred.doneCallbacks = [];
        _deferred.alwaysCallbacks = [];
        _deferred.failCallbacks = [];
        _deferred._then = function() {};
        _deferred._vals = [];
        _deferred.state = _deferred.states.pending;

        var reveal = {
           done: function(func) { _deferred.done(func); return this; },
            always: function(func) { _deferred.always(func); return this; },
            fail: function(func) { _deferred.fail(func); return this; },
            resolve: function() {
                var vals = Array.prototype.slice.apply(arguments);
                _deferred.resolve.apply(_deferred, vals);
                return this;
            },
            reject: function() { 
                var vals = Array.prototype.slice.apply(arguments);
                _deferred.reject.apply(_deferred, vals);
                return this;
            },
            state: function() { return _deferred.state; },
            isResolved: function() { return _deferred.isResolved(); },
            isRejected: function() { return _deferred.isRejected(); },
            'then': function(func) { _deferred._then = func; return this; },
            'get': function() { return _deferred._vals; },
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
                    'states': this.states
                };
            },
            states: function() { return _deferred.states; },
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
        return api;
    }

    

})(typeof window !== 'undefined' ? window : this);