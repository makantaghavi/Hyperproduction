var Type = require("hp/model/ports").Type;
var OscillationAnalyzer = require("hp/analysis/OscillationAnalyzer").OscillationAnalyzer;

var resetfn = function(ports, state) {
    state.analyzer = new OscillationAnalyzer(ports.threshold.get());
};

var initfn = function(ports, state, name, emt) {
    state.analyzer = new OscillationAnalyzer(ports.threshold.get());
    state.lastThreshold = ports.threshold.get();
    state.lastAlpha = ports.alpha.get();
    state.lastIn = null;
    state.lastInflection = Date.now();
    state.weightedFreq = 0;
    state.weightedAmp = 0;
    state.lastTimeDiff = null;
    state.alpha = ports.alpha.value;
    state.lastInflectionValue = null;
};

var tick = function (ports, state, id, tickData) {
  if (state.lastInflectionValue != null) {
    ports.inflection.set(state.lastInflectionValue);
    state.lastInflectionValue = null;
  } else {
    ports.inflection.set(0);
  }
};

var procfn = function(ports, state) {
    if (ports.threshold.get() != state.lastThreshold) {
        state.analyzer.threshold = ports.threshold.value;
        state.lastThreshold = ports.threshold.value;
    }
    if (ports.alpha.get() != state.lastAlpha) {
        state.alpha = ports.alpha.value;
        state.analyzer.alpha = ports.alpha.value;
        state.lastAlpha = ports.alpha.value;
    }
    if (ports.in.get() != state.lastIn) {
        var result = state.analyzer.push(ports.in.value);
        state.lastIn = ports.in.value;
        var now = Date.now();
        var timeDiff = now - state.lastInflection;
        var tmpWeightedFreq = state.weightedFreq;
        if (result[0]) {
            state.lastInflectionValue = result[1];
            state.lastInflection = now;
        }
        if (timeDiff <= 0) {
            // time did not change or skipped backwards
            return;
        }
        if (result[0]) {
            tmpWeightedFreq = (1 - state.alpha)*state.weightedFreq + state.alpha*(1000./timeDiff);
            state.weightedFreq = tmpWeightedFreq;
            state.weightedAmp = (1 - state.alpha)*state.weightedAmp + state.alpha*(Math.abs(result[1]));
            state.lastTimeDiff = timeDiff;
        } else {
            if (state.lastTimeDiff != null && timeDiff > 1.5*state.lastTimeDiff) {
                var alpha = Math.min(1., (parseFloat(timeDiff) / (state.lastTimeDiff * 6)));
                tmpWeightedFreq = (1 - alpha)*state.weightedFreq + alpha*(1000./timeDiff);
            }
        }
        ports.freq.set(tmpWeightedFreq);
        ports.amp.set(state.weightedAmp);
    }
};




exports.OscillationAnalyzer = {
    nodetype: "OscillationAnalyzer",
    generator: true,
    descr: " ",
    path: __filename,
    initFn: initfn,
    tick: tick,
    procfn : procfn,
    destroy: function(){},
    inputs: {
        in : { type : Type.OBJECT, defaultValue: []},
        threshold : { type : Type.FLOAT, defaultValue: .03 },
        alpha : { type : Type.FLOAT, defaultValue: .8 },
    },
    outputs : {
                  inflection: { type : Type.FLOAT, defaultValue: 0, continuous: true},
      freq: { type : Type.FLOAT, defaultValue: 0},
      amp: { type : Type.FLOAT, defaultValue: 0},
              },
    emitter: true,
};
