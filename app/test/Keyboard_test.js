var assert = require('assert');
var keyboard = require('hp/nodes/Keyboard');
var ports = require('hp/model/ports.js');
var map = require("hp/model/MapNode"); 

describe ("test KeyboardInput", function () {
    
    it ("should test KeyboardInput", function (done){
        var midiNote = 0;
        keyboard.KeyboardInputToMIDINote.procfn ({
            keyCode: { get: () => 60 },
            isKeyDown: { get: () => true },
            channel: { get: () => 1 },
            velocity: { get: () => 64 },
            midiNote: { set: (v) => midiNote = v }
        });
        assert.equal (midiNote, "a");
        done();
    });

});