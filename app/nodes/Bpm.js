var Type = require("hp/model/ports").Type;
//var ipc = require('ipc');
var MapNode = require("hp/model/MapNode");
var RunningState = require("hp/model/MapNode").RunningState;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
//require('hp/model/utils');


exports.BPM = {
    nodetype: "BPM",
    descr: "Generates BPM based on changes on input.",
    path: __filename,
    
    initFn: function (ports, state, name, emitter) {
        state.count=0;
        state.string_count=0;
    },

    procfn: function(ports, state, id, triggerPort) {
        if (triggerPort.name === "trigger"){
            state.string_count+=1;

            if (ports[triggerPort.name].get()=='1') {
                state.count+=1;
            }   
        }
        // console.log(state.count/state.string_count*((ports.fps.get())*60))
        ports.bpm.set(state.count/state.string_count*(ports.fps.get()*60));
    },
    inputs: {
        trigger : {type:Type.ANY, defaultValue:0},
        fps : {type:Type.INT, defaultValue:30}
    },
    outputs: {
        bpm : {type:Type.FLOAT, defaultValue:0}
    },
    variadicInput: true,
    variadicOutput: true
};
