var Type = require("hp/model/ports").Type;
// var RunningState = require("hp/model/MapNode").RunningState;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
var osc = require('osc-min');

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

exports.Uniqueness = {
  nodetype: "Uniqueness",
  descr: "Computes the unique deviation from the ensemble.",
  path: __filename,
  deprecated: true,
  inputs: {
    vln1: {type: Type.FLOAT, defaultValue: 0},
    vln2: {type: Type.FLOAT, defaultValue: 0},
    viola: {type: Type.FLOAT, defaultValue: 0},
    cello: {type: Type.FLOAT, defaultValue: 0},
    bass: {type: Type.FLOAT, defaultValue: 0},
    cl1: {type: Type.FLOAT, defaultValue: 0},
    cl2: {type: Type.FLOAT, defaultValue: 0},
    tuba: {type: Type.FLOAT, defaultValue: 0},
    keys: {type: Type.FLOAT, defaultValue: 0},
    perc: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    dvln1: {type: Type.FLOAT, defaultValue: 0},
    dvln2: {type: Type.FLOAT, defaultValue: 0},
    dviola: {type: Type.FLOAT, defaultValue: 0},
    dcello: {type: Type.FLOAT, defaultValue: 0},
    dbass: {type: Type.FLOAT, defaultValue: 0},
    dcl1: {type: Type.FLOAT, defaultValue: 0},
    dcl2: {type: Type.FLOAT, defaultValue: 0},
    dtuba: {type: Type.FLOAT, defaultValue: 0},
    dkeys: {type: Type.FLOAT, defaultValue: 0},
    dperc: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
//    state = 
},
tick: function (ports, state, id, tickData) {
  var mean = 0;
  for (var p in this.inputs) {
    mean += ports[p].get();
  }
  mean /= this.inputs.length;
  for (var p in this.inputs) {
    ports["d" + p].set(ports[p].get() - mean);
  }
},
procfn: function () {}
};

exports.UniquenessMain = {
  nodetype: "UniquenessMain",
  descr: "Computes the unique deviation from the main mix.",
  path: __filename,
  deprecated: true,
  inputs: {
    vln1: {type: Type.FLOAT, defaultValue: 0},
    vln2: {type: Type.FLOAT, defaultValue: 0},
    viola: {type: Type.FLOAT, defaultValue: 0},
    cello: {type: Type.FLOAT, defaultValue: 0},
    bass: {type: Type.FLOAT, defaultValue: 0},
    cl1: {type: Type.FLOAT, defaultValue: 0},
    cl2: {type: Type.FLOAT, defaultValue: 0},
    tuba: {type: Type.FLOAT, defaultValue: 0},
    keys: {type: Type.FLOAT, defaultValue: 0},
    perc: {type: Type.FLOAT, defaultValue: 0},
    main: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    dvln1: {type: Type.FLOAT, defaultValue: 0},
    dvln2: {type: Type.FLOAT, defaultValue: 0},
    dviola: {type: Type.FLOAT, defaultValue: 0},
    dcello: {type: Type.FLOAT, defaultValue: 0},
    dbass: {type: Type.FLOAT, defaultValue: 0},
    dcl1: {type: Type.FLOAT, defaultValue: 0},
    dcl2: {type: Type.FLOAT, defaultValue: 0},
    dtuba: {type: Type.FLOAT, defaultValue: 0},
    dkeys: {type: Type.FLOAT, defaultValue: 0},
    dperc: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
//    state = 
},
tick: function (ports, state, id, tickData) {
    var mean = ports.main.get(); //  / (Object.keys(this.inputs).length - 1)
    for (var p in this.inputs) {
      if (p !== "main") {
        ports["d" + p].set(ports[p].get() - mean);
      }
    }
  },
  procfn: function () {}
};

exports.UniquenessCounter = {
  nodetype: "UniquenessCounter",
  descr: "Computes a cumulative difference for each instrument from the ensemble.",
  path: __filename,
  deprecated: true,
  inputs: {
    vln1: {type: Type.FLOAT, defaultValue: 0},
    vln2: {type: Type.FLOAT, defaultValue: 0},
    viola: {type: Type.FLOAT, defaultValue: 0},
    cello: {type: Type.FLOAT, defaultValue: 0},
    bass: {type: Type.FLOAT, defaultValue: 0},
    cl1: {type: Type.FLOAT, defaultValue: 0},
    cl2: {type: Type.FLOAT, defaultValue: 0},
    tuba: {type: Type.FLOAT, defaultValue: 0},
    keys: {type: Type.FLOAT, defaultValue: 0},
    perc: {type: Type.FLOAT, defaultValue: 0},
    count: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    dvln1: {type: Type.FLOAT, defaultValue: 0},
    dvln2: {type: Type.FLOAT, defaultValue: 0},
    dviola: {type: Type.FLOAT, defaultValue: 0},
    dcello: {type: Type.FLOAT, defaultValue: 0},
    dbass: {type: Type.FLOAT, defaultValue: 0},
    dcl1: {type: Type.FLOAT, defaultValue: 0},
    dcl2: {type: Type.FLOAT, defaultValue: 0},
    dtuba: {type: Type.FLOAT, defaultValue: 0},
    dkeys: {type: Type.FLOAT, defaultValue: 0},
    dperc: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.counts = {};
    state.length;
    for (var p in this.inputs) {
      if (p !== "count") {
        state.counts[p] = 0;
        state.length++;
      }
    }
  },
  tick: function (ports, state, id, tickData) {
//    var count = ports.count.get() / state.counts.length / state.counts.length;
//    for (var p in this.inputs) {
//      if (p !== "count" && count > 0) {
//        state.counts[p] = MathUtil.clip(state.counts[p] + ((ports[p].get() > 0.5) ? count : -count), 0, 1);
//        ports["d" + p].set(state.counts[p]);
//      }
//    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (state.length > 0 && triggerPort !== ports.count) {
      var count = ports.count.get() / state.length;
      if (count > 0) {
        var p = triggerPort.name;
        state.counts[p] = MathUtil.clip(state.counts[p] + ((triggerPort.get() > 0.5) ? count : -count), 0, 1);
        ports["d" + p].set(state.counts[p]);
      }
    }
  }
};


exports.InstBreakout = {
  nodetype: "InstBreakout",
  descr: "Break out the muxed ensemble",
  path: __filename,
  deprecated: true,
  inputs: {
    ensemble: {type: Type.OBJECT, defaultValue: 0, continuous: true}
  },
  outputs: {
    vln1: {type: Type.FLOAT, defaultValue: 0},
    vln2: {type: Type.FLOAT, defaultValue: 0},
    viola: {type: Type.FLOAT, defaultValue: 0},
    cello: {type: Type.FLOAT, defaultValue: 0},
    bass: {type: Type.FLOAT, defaultValue: 0},
    cl1: {type: Type.FLOAT, defaultValue: 0},
    cl2: {type: Type.FLOAT, defaultValue: 0},
    tuba: {type: Type.FLOAT, defaultValue: 0},
    keys: {type: Type.FLOAT, defaultValue: 0},
    perc: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var ens = ports.ensemble.get();
    for (var p in this.outputs) {
      if (ens.hasOwnProperty(p)) {
        ports[p].set(ens[p]);
      }
    }
  }
};

exports.InstBreakin = {
  nodetype: "InstBreakin", 
  descr: "Mux instruments",
  path: __filename,
  deprecated: true,
  inputs: {
//    param: {type: Type.STRING, }
    vln1: {type: Type.FLOAT, defaultValue: 0},
    vln2: {type: Type.FLOAT, defaultValue: 0},
    viola: {type: Type.FLOAT, defaultValue: 0},
    cello: {type: Type.FLOAT, defaultValue: 0},
    bass: {type: Type.FLOAT, defaultValue: 0},
    cl1: {type: Type.FLOAT, defaultValue: 0},
    cl2: {type: Type.FLOAT, defaultValue: 0},
    tuba: {type: Type.FLOAT, defaultValue: 0},
    keys: {type: Type.FLOAT, defaultValue: 0},
    perc: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    ensemble: {type: Type.OBJECT, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
//    var mux = {};
//    for (var p in this.inputs) {
//      mux[p] = (ports[p].get());
//    }
//    ports.ensemble.set(mux);
    // the above is a sync mux, but I think we should be fine with a regular mux
    var tmp = {};
    tmp[triggerPort.name] = triggerPort.get();
    ports.ensemble.set(tmp);
  }
};

exports.ParamBreakin = {
  nodetype: "ParamBreakin", 
  descr: "Mux parameters",
  path: __filename,
  deprecated: true,
  inputs: {
    act_l: {type: Type.FLOAT, defaultValue: 0},
    act_r: {type: Type.FLOAT, defaultValue: 0},
    pitch_l: {type: Type.FLOAT, defaultValue: 0},
    pitch_r: {type: Type.FLOAT, defaultValue: 0},
    roll_l: {type: Type.FLOAT, defaultValue: 0},
    roll_r: {type: Type.FLOAT, defaultValue: 0},
    yaw_l: {type: Type.FLOAT, defaultValue: 0},
    yaw_r: {type: Type.FLOAT, defaultValue: 0},
    amp: {type: Type.FLOAT, defaultValue: 0},
    pitch: {type: Type.FLOAT, defaultValue: 0},
    timbre: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    params: {type: Type.OBJECT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var mux = {};
    for (var p in this.inputs) {
      mux[p] = (ports[p].get());
    }
    ports.params.set(mux);
  }
};

exports.ParamBreakout = {
  nodetype: "ParamBreakout", 
  descr: "Break out the muxed parameters",
  path: __filename,
  deprecated: true,
  inputs: {
    params: {type: Type.OBJECT, defaultValue: 0}
  },
  outputs: {
    act_l: {type: Type.FLOAT, defaultValue: 0},
    act_r: {type: Type.FLOAT, defaultValue: 0},
    pitch_l: {type: Type.FLOAT, defaultValue: 0},
    pitch_r: {type: Type.FLOAT, defaultValue: 0},
    roll_l: {type: Type.FLOAT, defaultValue: 0},
    roll_r: {type: Type.FLOAT, defaultValue: 0},
    yaw_l: {type: Type.FLOAT, defaultValue: 0},
    yaw_r: {type: Type.FLOAT, defaultValue: 0},
    amp: {type: Type.FLOAT, defaultValue: 0},
    pitch: {type: Type.FLOAT, defaultValue: 0},
    timbre: {type: Type.FLOAT, defaultValue: 0},
  },
  procfn: function (ports, state) {
    var params = ports.params.get();
    for (var p in this.outputs) {
      if (params.hasOwnProperty(p)) {
        ports[p].set(params[p]);
      }
    }
  }
};

exports.CuePlaying = {
  nodetype: "CuePlaying",
  descr: "Figure out who should be playing",
  path: __filename,
  deprecated: true,
  inputs: {
    nToPlay: {type: Type.INT, defaultValue: 0},
    nPlaying: {type: Type.INT, defaultValue: 0},
    isPlayingMux: {type: Type.MUX, defaultValue: 0}
  },
  outputs: {
    goPlayMux: {type: Type.MUX, defaultValue: 0}
  },
//  initFn: function (ports, state) {
//    state.lastShuffleTime = 0;
//  },
procfn: function (ports, state) {

},
tick: function (ports, state) {
  var nRemain = ports.nToPlay.get() - ports.nPlaying.get();
  var instMux = ports.isPlayingMux.get();
  var goMux = {};
  if (nRemain < 0) {
    for (var inst in instMux) {
      goMux[inst] = 0;
    }
  }
  else if (nRemain > 0) {
    var nonPlaying = [];
    for (var inst in instMux) {
      if (instMux[inst] < 0.8) {
        nonPlaying.push(inst);
      }
      goMux[inst] = instMux[inst];
    }
    MathUtil.shuffle(nonPlaying);
      // Later, track the last start and end times each instrument played.
      // Stop instruments that have played for too long (parameter plus some variance).
      // Sort shuffle list favouring those that haven't played recently.
      for (var i = 0; i < Math.min(nRemain, nonPlaying.length); i++) {
        goMux[nonPlaying[i]] = 1;
      }
    }
    ports.goPlayMux.set(goMux);
  }
};

exports.Rotate3D = {
  nodetype: "Rotate3D",
  descr: "Rotates a 3D vector",
  path: __filename,
  inputs: {
    pitch: {type: Type.FLOAT, defaultValue: 0},
    roll: {type: Type.FLOAT, defaultValue: 0},
    yaw: {type: Type.FLOAT, defaultValue: 0},
    Rx: {type: Type.FLOAT, defaultValue: 0},
    Ry: {type: Type.FLOAT, defaultValue: 0},
    Rz: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    rPitch: {type: Type.FLOAT, defaultValue: 0},
    rRoll: {type: Type.FLOAT, defaultValue: 0},
    rYaw: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    
  }
};

var INSTS = ["/bass", "/cello", "/cl1", "/cl2", "/keys", "/perc", "/tuba", "/viola", "/vln1", "/vln2"];
var MSGS = [{address: "/audio/detectedPitch", args: [60]},
            {address: "/audio/maxAmp", args: [0]},
            {address: "/audio/rms", args: [0]},
            {address: "/myo/acc/left", args: [0, 0, 0]},
            {address: "/myo/acc/right", args: [0, 0, 0]},
            {address: "/myo/emg/left", args: [0, 0, 0, 0, 0, 0, 0, 0]},
            {address: "/myo/emg/right", args: [0, 0, 0, 0, 0, 0, 0, 0]},
            {address: "/myo/ypr/left", args: [0, 0, 0]},
            {address: "/myo/ypr/right", args: [0, 0, 0]}];
var RESET_INSTS;


exports.FensadenseReset = {
  nodetype: "FensadenseReset",
  descr: "Emits a buffer of default values for all live params.",
  path: __filename,
  deprecated: true,
  inputs: {},
  outputs: {
    resetMuxBuf: {type: Type.BUF, defaultValue: RESET_INSTS}
  }
};

exports.IsPresent = {
  nodetype: "IsPresent",
  descr: "Outputs a high value on an output port if the key is contained within the list.",
  path: __filename,
  deprecated: true,
  inputs: {
    filterList: {type: Type.STRING, defaultValue: "*"},
    invert: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    "bass": {type: Type.BOOL, defaultValue: true},
    "cello": {type: Type.BOOL, defaultValue: true},
    "cl1": {type: Type.BOOL, defaultValue: true},
    "cl2": {type: Type.BOOL, defaultValue: true},
    "keys": {type: Type.BOOL, defaultValue: true},
    "perc": {type: Type.BOOL, defaultValue: true},
    "tuba": {type: Type.BOOL, defaultValue: true},
    "viola": {type: Type.BOOL, defaultValue: true},
    "vln1": {type: Type.BOOL, defaultValue: true},
    "vln2": {type: Type.BOOL, defaultValue: true}
  },
  initFn: function (ports, state) {
    var str = ports.filterList.get();
    var inv = !!ports.invert.get();
    if (typeof str === "string") {
      if (str === "*") {
        for (var p in ports) {
          if (ports[p].direction === "OUTPUT") {
            ports[p].set(!inv);
          }
        }
      }
      else if (str.length < 1 || str === "-") {
        for (var p in ports) {
          if (ports[p].direction === "OUTPUT") {
            ports[p].set(inv);
          }
        }
      }
      else {
        var keys = str.split(/[ _:;,-]/);
        for (var p in ports) {
          if (ports[p].direction === "OUTPUT") {
            ports[p].set((keys.includes(p)) ? !inv : inv);
          }
        }
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var str = ports.filterList.get();
    var inv = !!ports.invert.get();
    if (typeof str === "string") {
      if (str === "*") {
        for (var p in ports) {
          if (ports[p].direction === "OUTPUT") {
            ports[p].set(!inv);
          }
        }
      }
      else if (str.length < 1 || str === "-") {
        for (var p in ports) {
          if (ports[p].direction === "OUTPUT") {
            ports[p].set(inv);
          }
        }
      }
      else {
        var keys = str.split(/[ _:;,-]/);
        for (var p in ports) {
          if (ports[p].direction === "OUTPUT") {
            ports[p].set((keys.includes(p)) ? !inv : inv);
          }
        }
      }
    }
  },
  variadicOutput: true
};

exports.FindMaximum = {
  nodetype: "FindMaximum",
  path: __filename,
  deprecated: true,
  inputs: {
    paramMux: {type: Type.MUX, defaultValue: 0}
  },
  output: {
    vln1: {type: Type.FLOAT, defaultValue: 0},
    vln2: {type: Type.FLOAT, defaultValue: 0},
    viola: {type: Type.FLOAT, defaultValue: 0},
    cello: {type: Type.FLOAT, defaultValue: 0},
    bass: {type: Type.FLOAT, defaultValue: 0},
    cl1: {type: Type.FLOAT, defaultValue: 0},
    cl2: {type: Type.FLOAT, defaultValue: 0},
    tuba: {type: Type.FLOAT, defaultValue: 0},
    keys: {type: Type.FLOAT, defaultValue: 0},
    perc: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    var mux = triggerPort.get();
    var port;
    var maxVal = 0;
    var maxKey = null;
    for (var k in mux) {
      if (ports[k] && mux[k] > maxVal) {
        maxKey = k;
        maxVal = mux[k];
      }
    }
    for (var p in ports) {
      port = ports[p];
      if (port.direction === "OUTPUT") {
        port.set((p === maxKey) ? 1 : 0);
      }
    }
  }
};

exports.InstrumentOSCMerge = {
  nodetype: "InstrumentOSCMerge",
  path: __filename,
  deprecated: true,
  inputs: {
    vln1: {type: Type.OBJECT, defaultValue: 0},
    vln2: {type: Type.OBJECT, defaultValue: 0},
    viola: {type: Type.OBJECT, defaultValue: 0},
    cello: {type: Type.OBJECT, defaultValue: 0},
    bass: {type: Type.OBJECT, defaultValue: 0},
    cl1: {type: Type.OBJECT, defaultValue: 0},
    cl2: {type: Type.OBJECT, defaultValue: 0},
    tuba: {type: Type.OBJECT, defaultValue: 0},
    keys: {type: Type.OBJECT, defaultValue: 0},
    perc: {type: Type.OBJECT, defaultValue: 0}
  },
  outputs: {
    oscOut: {type: Type.OBJECT, defaultValue: null},
    bufOut: {type: Type.BUF, defaultValue: 0} 
  },
  procfn: function (ports, state, id, triggerPort) {
    var msg = triggerPort.get();
    if (msg && msg.address) {
      msg.address = "/" + triggerPort.name + msg.address;
      ports.oscOut.set(msg);
      ports.bufOut.set(osc.toBuffer(msg));
    }
  }
};

exports.FensadenseOSCFilter = {
  nodetype: "FensadenseOSCFilter",
  path: __filename,
  deprecated: true,
  inputs: {
    //TODO: reinstate other input types
//    bufIn: {type: Type.BUF, defaultValue: null},
//    oscIn: {type: Type.OBJECT, defaultValue: null},
    oscArr: {type: Type.OBJECT, defaultValue: []},

  },
  outputs: {
    bufOut: {type: Type.BUF, defaultValue: 0.0},
    _myo_acc_right:       {type: Type.OBJECT, defaultValue:0},
    _cello_myo_quat_left: {type: Type.OBJECT, defaultValue:0},
    _cello_myo_acc_left:  {type: Type.OBJECT, defaultValue:0},
    _viola_myo_quat_right:{type: Type.OBJECT, defaultValue:0},
    _viola_myo_acc_right: {type: Type.OBJECT, defaultValue:0},
    _viola_myo_quat_left: {type: Type.OBJECT, defaultValue:0},
    _viola_myo_acc_left:  {type: Type.OBJECT, defaultValue:0},
    _cello_myo_quat_right:{type: Type.OBJECT, defaultValue:0},
    _cello_myo_acc_right: {type: Type.OBJECT, defaultValue:0},
    _vln2_myo_acc_right: {type: Type.OBJECT, defaultValue:0},
    _horae_time:          {type: Type.OBJECT, defaultValue:0},
    time: {type: Type.FLOAT, default: 0}
  },
  procfn:function (ports, state, id, triggerPort) {
    var msgs;
    if (triggerPort.name === "bufIn") {
      handleMsg(osc.fromBuffer(ports.bufIn.get()));
    } else if (triggerPort.name === "oscArr") {
      msgs = ports.oscArr.get();
      for (var i in msgs) {
        var msg = msgs[i];
        if(msg && msg !== '') {
          // TODO: Figure out what the Function entries are that come through
          if (typeof msg != "function"){  
            handleMsg(msg, ports, state);
          }
        }
      }
    } else {
      handleMsg(ports.oscIn.get(), ports, state);
    }
  }
};

function handleMsg(msg, ports, state) {
  if(msg && msg !== '') {
    var translated = msg["address"].replace(/\//g,'_');
    for (var prefix in ports) {
      if (translated.indexOf(prefix) === 0) {
        ports[prefix].set(msg.args);
        break;
      }
    }
  }
}
