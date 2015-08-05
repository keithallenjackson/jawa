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
            progressCallbacks = [],
            vals = [],
            state = 'pending';

        var reveal = {
            done: function(func) { doneCallbacks.push(func); return this; },
            always: function(func) { alwaysCallbacks.push(func); return this; },
            fail: function(func) { failCallbacks.push(func); return this; },
            progress: function(func) { progressCallbacks.push(func); return this; },
            notify: function() {
                var args = Array.prototype.slice.apply(arguments),
                    i = 0;
                for(; i < progressCallbacks.length; i++) {
                    progressCallbacks[i].apply(global, args);
                }
                return this;
            },
            notifyWith: function() {
                var args = Array.prototype.slice.apply(arguments),
                    i = 0,
                    ctx = args.unshift() || global;
                for(; i < progressCallbacks.length; i++) {
                    progressCallbacks[i].apply(ctx, args);
                }
                return this;
            },
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
                    'progress': this.progress
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
                obj.hasOwnProperty('progress') &&
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
                obj.hasOwnProperty('notify') &&
                obj.hasOwnProperty('notifyWith') &&
                obj.hasOwnProperty('progress') &&
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
            api.notify(totalDone, promises.length);
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

    var WebAudio = global.AudioContext || global.webkitAudioContext;
    if(!WebAudio) {
        throw "WebAudio is not supported in your browser. Use an updated web browser to have the awesomeness";
    }

    var jawa = function(input) {
        var node = Object.create(fn),
            options = {},
            def = deferred();
        node._channel = channel();
        node._fxChain = chain();
        node._fxChain._output = node._channel._input;
        node._channel._output = context.destination;

        jawa.load(input).done(function(buffer) {
            node._buffer = buffer;
            node._playbackOffset = 0;
            node._playbackStarted = null;
            def.resolve(node);
        }).fail(function(error) {
            console.log(error);
            throw "Error in loading audio";
        }).progress(function() {
            var args = Array.prototype.slice.apply(arguments);
            def.notify.apply(def, args);
        });

        return def.promise();
    };

    var fn = jawa.fn = {
        play: function() {
            if(!this._source) {
                this._source = context.createBufferSource();
                this._source.buffer = this._buffer;
            }
            this._source.connect(this._fxChain._input);
            this._playbackStarted = context.currentTime;
            this._source.start(0, this._playbackOffset % this._buffer.duration);
            return this;
        },
        stop: function() {
            if(this._source) {
                this._source.disconnect(this._fxChain._input);
                this._source.stop();
                this._playbackOffset = 0;
                this._source = null;
            }
            return this;
        },
        pause: function() {
            if(this._source) {
                this._source.disconnect(this._fxChain._input);
                this._source.stop();
                this._source = null;
                this._playbackOffset += context.currentTime - this._playbackStarted;
            }
            return this;
        },
        volume: function(level) {
        },
        pan: function(level) {
            this._channel.pan(level);
            return this;
        },
        rewind: function(ms) {
            var seconds = ms / 1000;
            this.pause();
            this._playbackOffset -= seconds;

            if(this._playbackOffset < 0) {
                this._playbackOffset = 0;
            }

            this.play();
            return this;
        },
        fastForward: function(ms) {
            var seconds = ms / 1000;
            this.pause();
            this._playbackOffset += seconds;

            if(this._playbackOffset > this._buffer.duration) {
                this._playbackOffset = this._buffer.duration;
            }

            this.play();
            return this;
        }
    };


    jawa.extend = fn.extend = function() {
        var source,
            target,
            name,
            current = 0;
        
        if(typeof arguments[current] === 'string') {
            name = arguments[current];
            current++;
        }
        
        if(typeof arguments[current] === 'function' || typeof arguments[current] === 'object') {
            source = arguments[current];
            current++;
        }
        
        if(this === jawa.fn) {
            target = jawa.fn;
        } else if(arguments[current]) {
            target = arguments[current];
        }
        
        if(!source || !target ) {
            return;
        }

        if(typeof source === 'function') {
            target[name] = source;
        } else if(typeof source === 'object') {
            for(var prop in source) {
                target[prop] = source[prop];
            }
        }

    };

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
                    def.notify(e.loaded, e.total);
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
    var chain = jawa.chain = function() {
        var fxList = [],
            ret = {},
            input = null,
            output = null;

        Object.defineProperties(ret, {
            'length': {
                get: function() {
                    return fxList.length;
                }
            },
            '_input': {
                get: function() {
                    return fxList[0] || output;
                },
                set: function(value) {

                    if(output && fxList.length < 1) {
                        if(input) {
                            input.disconnect(output);
                        }
                        value.connect(output);
                    } else if(fxList.length > 0) {
                        if(input) {
                            input.disconnect(fxList[0]);
                        }
                        value.connect(fxList[0]);
                    }
                    input = value;
                }
            },
            '_output': {
                get: function() {
                    return fxList[fxList.length - 1] || input;
                },
                set: function(value) {
                    if(input && fxList.length < 1) {
                        if(output) {
                            input.disconnect(output);
                        }
                        input.connect(value);
                    } else if(fxList.length > 0) {
                        if(output) {
                            fxList[fxList.length - 1].disconnect(output);
                        }
                        fxList[fxList.length - 1].connect(value);
                    }
                    output = value;
                }
            }
        });

        ret.addAt = function(fx, index) {
            fxList.splice(index, 0, fx);
            if(fxList.length === 1) {
                if(output && input) {
                    input.disconnect(output);
                }
                if(output) {
                    fxList[index].connect(output);
                }
                if(input) {
                    input.connect(fxList[index]);
                }
            } else if(index === fxList.length - 1) {
                if(output) {
                    fxList[index].connect(output);
                    fxList[index - 1].disconnect(output);
                }
                fxList[index - 1].connect(fxList[index]);
            } else if(index === 0) {
                if(input) {
                    input.disconnect(fxList[index + 1]);
                    input.connect(fxList[index]);
                }
                fxList[index].connect(fxList[index + 1]);
            } else {
                fxList[index - 1].disconnect(fxList[index + 1]);
                fxList[index - 1].connect(fxList[index]);
                fxList[index].connect(fxList[index + 1]);
            }
            return fxList.length;
        };
        ret.append = function(fx) {
            return ret.addAt(fx, fxList.length);
        };
        ret.prepend = function(fx) {
            return ret.addAt(fx, 0);
        };
        ret.removeAt = function(index) {
            if(fxList.length === 0) {
                return 0;
            } else if(index > fxList.length - 1) {
                return -1;
            } else if(index < 0) {
                throw "Index cannot be negative";
            } else if(fxList.length === 1) {
                if(input && output) {
                    input.connect(output);
                }
                if(input) {
                    input.disconnect(fxList[index]);
                }
                if(output) {
                    fxList[index].disconnect(output);
                }
            } else if(index === fxList.length - 1) {
                if(output) {
                    fxList[index].disconnect(output);
                    fxList[index - 1].connect(output);
                }
                fxList[index - 1].disconnect(fxList[index]);
            } else if(index === 0) {
                if(input) {
                    input.disconnect(fxList[index]);
                    input.conect(fxList[index + 1]);
                }
                fxList[index].disconnect(fxList[index - 1]);
            } else {
                fxList[index - 1].disconnect(fxList[index]);
                fxList[index].disconnect(fxList[index + 1]);
                fxList[index - 1].connect(fxList[index + 1]);
            }
            return fxList.splice(index, 1);
        };
        ret.output = function(obj) {
            if(fxList.length > 0) {
                if(output) {
                    fxList[fxList.length - 1].disconnect(output);
                }
                fxList[fxList.length - 1].connect(obj);
                output = obj;
            } else {
                if(output && input) {
                    input.disconnect(output);
                }

                output = obj;

                if(input) {
                    input.connect(output);
                }
            }
        };

        ret.input = function(obj) {
            if(fxList.length > 0) {

                if(input) {
                    input.disconnect(fxList[0]);
                }
                obj.connect(fxList[0]);
                input = obj;
            } else {
                if(input && output) {
                    input.disconnect(output);
                }

                input = obj;

                if(output) {
                    input.connect(output);
                }
            }
        };



        return ret;

    };

    var channel = jawa.channel = function() {
        var panner = context.createPanner(),
            lowPass = context.createBiquadFilter(),
            highPass = context.createBiquadFilter(),
            bandPass = context.createBiquadFilter(),
            gain = context.createGain(),
            input = null,
            output = null,
            chn = chain();


        panner.panningModel = "equalpower";
        panner.setPosition(0,0,0);

        lowPass.type = "lowshelf";
        lowPass.frequency.value = 440;
        lowPass.gain.value = 0;

        highPass.type = "highshelf";
        highPass.frequency.value = 6000;
        highPass.gain.value = 0;

        bandPass.type = "peaking";
        bandPass.frequency.value = 1000;
        bandPass.Q.value = 1;
        bandPass.gain.value = 0;

        gain.gain.value = 1;

        chn.append(gain);
        chn.append(highPass);
        chn.append(bandPass);
        chn.append(lowPass);
        chn.append(panner);
        chn.pan = function(val) {
            var value = val > 1 ? 1   :
                        val < -1 ? -1 :
                        val;
            panner.setPosition(value, 0, 0);
            return this;
        };

        return chn;

    };

    global.jawa = jawa;

    jawa.fn.extend("fx", function(name, types, fx_func) {
       if(!context[nodeName]) {
           throw "fx type does not exist";
       }
       if(!name) {
           throw "fx name not valid.";
       }
       var func = fx_func || function(){};
       var that = this;
       var chn = chain();
       var fx = [];
       var index = 0;
       var currentFx;
       
       if(typeof types === 'string') {
           types = [types];
       } 
       
       if(types instanceof Array) {
           for(; index < type.length; index++) {
               currentFx = context['create' + types[index]]();
               chn.add(currentFx);
               fx.push(currentFx);
           }
       } else {
           throw "Type neither a string or an array.";
       }

       jawa.fn.extend(name, function() {
           func.apply(this, fx);
       });
       
    });

})(typeof window !== 'undefined' ? window : this);
