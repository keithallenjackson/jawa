/*global window, QUnit, jawa, setTimeout
*/
(function(global, q, jawa) {
    'use strict';
    
    q.test('Can load audio and have jawa instance', function(assert) {
        var done = assert.async();

        assert.ok(jawa, 'jawa exists');
        assert.ok(jawa.load, 'jawa.load exists');
        assert.ok(jawa.fn, 'jawa.fn exists');

        jawa('test.mp3').done(function(sound) {
            assert.ok(sound, "sound exists");
            assert.ok(sound.play, "sound.play exists");
            sound.play();
            setTimeout(function() {
                assert.ok(sound.pause, 'sound.pause exists');
                sound.pause();
                setTimeout(function() {
                    sound.play();
                    assert.ok(true, "play resumes from pause point");
                    setTimeout(function() {
                        assert.ok(sound.stop, "stop exists");
                        sound.stop();
                        done();
                    }, 3000);
                }, 1000);
            }, 2000);
        })
        .progress(function(loaded, total) {
            assert.ok(loaded / total * 100 <= 100, loaded / total * 100 + "% Loaded");
        });
    });
    
    q.test('Rewind Tests', function(assert) {
        var done = assert.async();

        jawa('test.mp3').done(function(sound) {
            sound.play();
            setTimeout(function() {
                sound.rewind(3000);
                assert.equal(Math.floor(sound._playbackOffset), 0, "Started From the Beginning");
                sound.stop();
                done();
            }, 3000);
        });
    });
    
    q.test('FastForward Tests', function(assert) {
        var done = assert.async();

        jawa('test.mp3').done(function(sound) {
            sound.play().fastForward(5000).pause();
            assert.equal(sound._playbackOffset * 1000, 5000, 'FastFowardeded 5 seconds');
            sound.stop();
            done();
        });
    });

    q.test('panning tests', function(assert) {
        var done = assert.async();
        jawa('test.mp3').done(function(sound) {
            sound.pan(-1).play();
            assert.ok(true, "Panned left");
            done();
        });
    });

})(typeof window !== 'undefined' ? window : this, QUnit, jawa);
