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
            pannerValue = null,
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
        lowPass.gain.value = 15;

        highPass.type = "highshelf";
        highPass.frequency.value = 6000;
        highPass.gain.value = -15;

        bandPass.type = "peaking";
        bandPass.frequency.value = 1000;
        bandPass.Q.value = 1;
        bandPass.gain.value = -15;

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
            pannerValue = value;

            return this;
        };
        chn.low = function(gain, cutoff) {

            if(gain) {
                lowPass.gain.value = gain;
            }
            if(cutoff) {
                lowPass.frequency.value = cutoff;
            }
            return this;
        };
        return chn;

    };

    global.jawa = jawa;
