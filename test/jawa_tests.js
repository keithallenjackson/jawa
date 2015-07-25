/*global window, QUnit, jawa, setTimout
*/
(function(global, q, jawa) {
    'use strict';
    
    q.test('Can load audio', function(assert) {
        var done = assert.async();

        assert.ok(jawa, 'jawa exists');
        assert.ok(jawa.load, 'jawa.load exists');
        assert.ok(jawa.fn, 'jawa.fn exists');

        jawa('test.mp3').done(function(sound) {
            assert.ok(sound, "sound exists");
            assert.ok(sound.play, "sound.play exists");
            sound.play();
            setTimeout(function() {
                assert.ok(sound.stop, 'sound.stop exists');
                sound.stop();
                done();
            }, 2000);
        });
    });
    
    
})(typeof window !== 'undefined' ? window : this, QUnit, jawa);
