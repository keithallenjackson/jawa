
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
