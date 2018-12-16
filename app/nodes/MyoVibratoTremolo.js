var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
var CBuffer = require("CBuffer");

var OscillationAnalysis = require("hp/analysis/OscillationAnalyzer");
var VecOscillationAnalyzer = OscillationAnalysis.VecOscillationAnalyzer;
var OscillationAnalyzer = OscillationAnalysis.OscillationAnalyzer;


var initfn = function(ports, state) {
    state.tremoloAnalyzer = new VecOscillationAnalyzer(3, .5, .02);
    state.vibratoAnalyzer = new VecOscillationAnalyzer(3, .5, .01);
    state.lastAccObjRight = null;
    state.lastAccObjLeft = null;
};

var procfn = function(ports, state) {
    var accObjRight = ports.accObjRight.get();
    if (accObjRight != state.lastAccObjRight && accObjRight.orientation != null) {
        // acc change
        state.lastAccObjRight = accObjRight;
        var result = state.tremoloAnalyzer.pushVector(
            [accObjRight.orientation.x, accObjRight.orientation.y, accObjRight.orientation.z]
            );
        ports.tremoloRate.set(result[0]);
        ports.tremoloAmp.set(result[1]);
        ports.tremolo.set({freq: result[0], amp: result[1]});
    }
    var accObjLeft = ports.accObjLeft.get();
    if (accObjLeft != state.lastAccObjLeft && accObjLeft.orientation != null) {
        // acc change
        state.lastAccObjLeft = accObjLeft;
        var result = state.vibratoAnalyzer.pushVector(
            [accObjLeft.orientation.x, accObjLeft.orientation.y, accObjLeft.orientation.z]
            );
        ports.vibratoRate.set(result[0]);
        ports.vibratoAmp.set(result[1]);
        ports.vibrato.set({freq: result[0], amp: result[1]});
    }
    return state;
};

exports.MyoVibratoTremolo = {
    nodetype: "MyoVibratoTremolo",
    generator: true,
    descr: " ",
    path: __filename,
    initFn: initfn,
    procfn : procfn,
    inputs: {
        accObjRight : { type : Type.OBJECT, defaultValue: {}},
        accObjLeft : { type : Type.OBJECT, defaultValue: {}},
        emgObjRight : { type : Type.OBJECT, defaultValue: {}},
        emgObjLeft : { type : Type.OBJECT, defaultValue: {}},
        threshold : { type : Type.FLOAT, defaultValue: .3 },
    },
    outputs : {
                  /*
                   *  tremolo : { rate: hz, amplitude: float }
                   */
                  tremolo: { type : Type.OBJECT, defaultValue: {}},
                  tremoloRate: { type : Type.FLOAT, defaultValue: 0},
                  tremoloAmp: { type : Type.FLOAT, defaultValue: 0},
                  /*
                   *  vibrato : { rate: hz, amplitude: float }
                   */
                  vibrato: { type : Type.OBJECT, defaultValue: {}},
                  vibratoRate: { type : Type.FLOAT, defaultValue: 0},
                  vibratoAmp: { type : Type.FLOAT, defaultValue: 0},
              },
    emitter: true,
};
