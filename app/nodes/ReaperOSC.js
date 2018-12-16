var Type = require("hp/model/ports").Type;
var osc = require('osc-min');

function clip(i, lo, hi) {
    if (i < lo) {
        return lo;
    }
    if (i > hi) {
        return hi;
    }
    return i;
}

exports.ReaperTrackVolume = {
	nodetype: "ReaperTrackVolume",
	descr: "Control volume of reaper tracks",
	inputs: {
        N: {type: Type.ANY, defaultValue: 0},
        track0 : {type: Type.ANY, defaultValue: 1},
        inputMagnitude: {type: Type.ANY, defaultValue: 0}
	},
	outputs: {
		bufOut: {type: Type.BUF, defaultValue: 0}
	},
	procfn: function(ports, state, id, triggerPort) {
        if (triggerPort.name == "inputMagnitude") {
            var N = parseInt(ports.N.get());
            var inputMagnitude = ports.inputMagnitude.get();
            for (var i = 0; i < N; i++) {
                var volume = clip(inputMagnitude*N - i, 0, 1)*.7;
                var oscMsg = osc.toBuffer({
                    address: "/track/"+(i+parseInt(ports.track0.value))+"/volume",
                    args: [ volume ]
                });
                ports.bufOut.set(oscMsg);
            }
        }
	}
};