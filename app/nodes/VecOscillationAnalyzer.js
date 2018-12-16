var Type = require("hp/model/ports").Type;
var VecOscillationAnalyzer = require("hp/analysis/OscillationAnalyzer").VecOscillationAnalyzer;

var resetfn = function(ports, state) {
    state.vecAnalyzer = new VecOscillationAnalyzer(ports.vector.get().length, ports.alpha.get(), ports.threshold.get());
};

var initfn = function(ports, state) {
    state.lastThreshold = ports.threshold.get();
    state.lastAlpha = ports.alpha.get();
    state.lastVector = [];
    if (state.nDimensions == null || state.nDimensions != ports.vector.get().length) {
        // reset when dimensions of input change
        resetfn(ports, state);
    }
};
var procfn = function(ports, state) {
    if (state.nDimensions == null || state.nDimensions != ports.vector.get().length) {
        // reset when dimensions of input change
        resetfn(ports, state);
        state.nDimensions = ports.vector.value.length;
    }
    if (ports.threshold.get() != state.lastThreshold) {
        state.vecAnalyzer.setThreshold(ports.threshold.value);
        state.lastThreshold = ports.threshold.value;
    }
    if (ports.alpha.get() != state.lastAlpha) {
        state.vecAnalyzer.alpha = ports.alpha.value;
        state.lastAlpha = ports.alpha.value;
    }
    if (ports.vector.get() != state.lastVector) {
        var result = state.vecAnalyzer.pushVector(ports.vector.value);
        state.lastVector = ports.vector.value;
        ports.rate.set(result[0]);
        ports.amp.set(result[1]);
    }
};




exports.VecOscillationAnalyzer = {
    nodetype: "VecOscillationAnalyzer",
    path: __filename,
    generator: true,
    descr: " ",
    initFn: initfn,
    procfn : procfn,
    destroy: function(){},
    inputs: {
        vector : { type : Type.OBJECT, defaultValue: []},
        threshold : { type : Type.FLOAT, defaultValue: .03 },
        alpha : { type : Type.FLOAT, defaultValue: .8 },
    },
    outputs : {
                  /*
                   *  tremolo : { rate: hz, amplitude: float }
                   */
                  rate: { type : Type.FLOAT, defaultValue: 0},
                  amp: { type : Type.FLOAT, defaultValue: 0},
              },
    emitter: true,
};
