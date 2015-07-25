
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
