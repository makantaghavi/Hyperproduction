var Type = require("hp/model/ports").Type;
var bb = require("hp/model/benb_utils.js");
var Direction = require("hp/model/ports").Direction;
var RunningState = require("hp/model/MapNode").RunningState;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");


exports.Identity = {
  nodetype: "Identity",
  descr : "Input Identity",
  path: __filename,
  procfn : function(ports) {
      //l.log("debug","  - Value of port i1 "+ports.i1.id+ " is "+ports.i1.get());
      // ports.o1.set(ports.i1.get());
      // ports.o2.set(ports.i2.get());
      for (var input in this.inputs) {
        ports[input.replace('i', 'o')].set(ports[input].get());
      }
    },
  inputs : {
    i1: { type : Type.INT, defaultValue : 0 },
  },
  outputs : {
    o1: { type : Type.INT, defaultValue : 0 },
  },
  variadicInput: true,
  variadicOutput: true
};

exports.Multiply = {
  nodetype: "Multiply",
  descr : "Multiply Inputs",
  path: __filename,
  procfn : function(ports) {
      var product = 1;
      for (var input in this.inputs) {
        product *= ports[input].get();
      }
      ports.product.set(product);
    },
  inputs : {
    i1: { type : Type.NUM, defaultValue : 0.0 },
    i2: { type : Type.NUM, defaultValue : 0.0 },
  },
  outputs : {
    product: { type : Type.NUM, defaultValue : 0.0 },
  },
  variadicInput: true
};

exports.Add = {
  nodetype: "Add",
  descr : "Add Inputs",
  path: __filename,
  procfn : function(ports) {
      var sum = 0;
      for (var input in this.inputs) {
        sum += +ports[input].get();
      }
      ports.sum.set(sum);
    },
  inputs : {
    i1: { type : Type.NUM, defaultValue : 0.0 },
    i2: { type : Type.NUM, defaultValue : 0.0 },
  },
  outputs : {
    sum: { type : Type.NUM, defaultValue : 0.0 },
  },
  variadicInput: true
};
//limit the values between 0 and 1
//t_sample f_pan = (x->f_pan<0) ? 0.0 : (x->f_pan>1) ? 1.0 : x->f_pan;
    
//what do we want
//if were panning left, we increase volume on that channel
//decrease proportionally on the other
//and VV

// full left = signal * 1.0 (come out left) right = signal * 0.0

// exports.NumPan = {
//   nodetype: "numPan",
//   descr : "an example",
//   path: _filename,
//   procfn : function(ports) {
//     var left  = 0;//init
//     var right = 0;//init
// //sum += +ports[input].get();
// //sum = sum + +ports[input].get();
//     for (var input in this.inputs) {
//     //     left = left + ports.input.get();
//     left = left + ports.input.get() * (1 - ports.input.get())
//     right = right + ports.input.get() * (1 - ports.input.get())
//     }
//     ports.left.set(left);
//     ports.right.set(right);
//   },
//   inputs : {
//     i1: { type : Type.NUM, defaultValue : 0.0 },
//     i2: { type : Type.NUM, defaultValue : 0.0 },
//   },
//   outputs : {
//     left: { type : Type.NUM, defaultValue : 0.0 },
//     right: { type : Type.NUM, defaultValue : 0.0 },

//   },
//   variadicInput: true

// };

///////////
exports.Max = {
  nodetype: "Maximum",
  descr: "The greater of the input values",
  path: __filename,
  procfn: function (ports) {
    // ports.max.set(Math.max(ports.i1.get(), ports.i2.get()));
    var max = Number.NEGATIVE_INFINITY;
    var v;
    for (var input in this.inputs) {
      v = Number.parseFloat(ports[input].get());
      if (v > max) {
        max = v;
      }
    }
    ports.max.set(max);
  },
  inputs: {
    i1: {type: Type.FLOAT, defaultValue: Number.NEGATIVE_INFINITY},
    i2: {type: Type.FLOAT, defaultValue: Number.NEGATIVE_INFINITY}
  },
  outputs: {
    max: {type: Type.FLOAT, defaultValue: 0.0}
  },
  variadicInput: true
};

exports.Min = {
  nodetype: "Minimum",
  descr: "The lesser of the input values",
  path: __filename,
  procfn: function (ports) {
    // ports.min.set(Math.min(ports.i1.get(), ports.i2.get()));
    var min = Number.POSITIVE_INFINITY;
    var v;
    for (var input in this.inputs) {
      v = Number.parseFloat(ports[input].get());
      if (v < min) {
        min = v;
      }
    }
    ports.min.set(min);
  },
  inputs: {
    i1: {type: Type.FLOAT, defaultValue: Number.POSITIVE_INFINITY},
    i2: {type: Type.FLOAT, defaultValue: Number.POSITIVE_INFINITY}
  },
  outputs: {
    min: {type: Type.FLOAT, defaultValue: 0.0}
  },
  variadicInput: true
};

exports.Mean = {
  nodetype: "Mean",
  descr: "The mean of the input values",
  path: __filename,
  procfn: function (ports) {
    // ports.mean.set((ports.i1.get() + ports.i2.get()) / 2.0);
    var sum = 0, count = 0;
    for (var input in this.inputs) {
      sum += Number.parseFloat(ports[input].get());
      count++;
    }
    ports.mean.set(sum / count);
  },
  inputs: {
    i1: {type: Type.FLOAT, defaultValue: 0},
    i2: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    mean: {type: Type.FLOAT, defaultValue: 0.0}
  },
  variadicInput: true
};

exports.Abs = {
  nodetype: "Abs",
  descr: "The absolute value of the input",
  path: __filename,
  procfn: function (ports) {
    ports.abs.set(Math.abs(Number.parseFloat(ports.value.get())));
  },
  inputs: {
    value: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    abs: {type: Type.FLOAT, defaultValue: 0.0}
  }
};

exports.Floor = {
  nodetype: "Floor",
  descr: "The closest integer less than the input",
  path: __filename,
  inputs: {
    value: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    floor: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports) {
    ports.floor.set(Math.floor(ports.value.get()));
  }
};

exports.Ceiling = {
  nodetype: "Ceiling",
  descr: "The closest integer greater than the input",
  path: __filename,
  inputs: {
    value: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    ceiling: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports) {
    ports.ceiling.set(Math.ceil(ports.value.get()));
  }
};

exports.Round = {
  nodetype: "Round",
  descr: "The closest integer to the input",
  path: __filename,
  inputs: {
    value: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    rounded: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports) {
    ports.rounded.set(Math.round(ports.value.get()));
  }
};

exports.Power = {
  nodetype: "Power",
  descr: "Computes a value raised to an exponent.",
  path: __filename,
  inputs: {
    base: {type: Type.NUM, defaultValue: 0},
    exponent: {type: Type.NUM, defaultValue: 1},
  },
  outputs: {
    value: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports) {
    ports.value.set(Math.pow(ports.base.get(), ports.exponent.get()));
  }
};

exports.Clip = {
  nodetype: "Clip",
  descr: "Clip an input value within a range",
  path: __filename,
  procfn: function (ports) {
    var v = ports.value.get();
    ports.clipped.set(v > ports.max.get() ? ports.max.get() : (v < ports.min.get() ? ports.min.get() : v));
  },
  inputs: {
    value: {type: Type.FLOAT, defaultValue: 0},
    min: {type: Type.FLOAT, defaultValue: 0},
    max: {type: Type.FLOAT, defaultValue: 1},
  },
  outputs: {
    clipped: {type: Type.FLOAT, defaultValue: 0}
  }
};

exports.Offset = {
  nodetype: "Offset",
  descr: "Shifts a value within a modular space",
  path: __filename,
  inputs: {
    input: {type: Type.FLOAT, defaultValue: 0},
    min: {type: Type.FLOAT, defaultValue: -1},
    max: {type: Type.FLOAT, defaultValue: 1},
    offset: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    value: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports) {
    var v = ports.input.get() + Number.parseFloat(ports.offset.get());
    var min = ports.min.get(), max = ports.max.get();
    var d = Math.abs(max - min);
    if (d > Number.EPSILON) {
      while (v > max) {
        v -= d;
      }
      while (v < min) {
        v += d;
      }
      ports.value.set(v);
    }
  }
};

exports.Negative = {
  nodetype: "Negate",
  descr : "Negates the input value",
  path: __filename,
  procfn : function(ports) {
    ports.o1.set(-1 * Number.parseFloat(ports.i1.get()));
  },
  inputs : {
    i1: { type : Type.FLOAT, defaultValue : 0 },
  },
  outputs : {
    o1: { type : Type.FLOAT, defaultValue : 0 },
  },
};

exports.Invert = {
  nodetype: "Invert",
  descr: "Inverts the input value",
  path: __filename,
  procfn: function(ports) {
    ports.o1.set(1 - ports.i1.get());
  },
  inputs: {
    i1: {type: Type.FLOAT, defaultValue: 0 },
  },
  outputs: {
    o1: {type: Type.FLOAT, defaultValue: 0},
  },
};


exports.ToSigned = {
  nodetype: "ToSigned",
  descr: "Converts [0..1] to [-1..1]",
  path: __filename,
  procfn: function(ports) {
    ports.signed.set(ports.unsigned.get() * 2 - 1);
  },
  inputs: {
    unsigned: {type: Type.FLOAT, defaultValue: 0},
  },
  outputs: {
    signed: {type: Type.FLOAT, defaultValue: 0},
  },
};


exports.ToUnsigned = {
  nodetype: "ToUnsigned",
  descr: "Converts [-1..1] to [0..1]",
  path: __filename,
  procfn: function(ports) {
    ports.unsigned.set((ports.signed.get() + 1) * 0.5);
  },
  inputs: {
    signed: {type: Type.FLOAT, defaultValue: 0},
  },
  outputs: {
    unsigned: {type: Type.FLOAT, defaultValue: 0},
  },
};


exports.To2D = {
  nodetype: "To2D",
  descr: "Converts an one-dimensional index to x and y indices",
  path: __filename,
  inputs: {
    index: {type: Type.NUM, defaultValue: 0},
    width: {type: Type.INT, defaultValue: 2}
  },
  outputs: {
    x: {type: Type.NUM, defaultValue: 0},
    y: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports) {
    var i = ports.index.get();
    var w = ports.width.get();
    ports.x.set(i % w);
    ports.y.set(Math.floor(i / w));
  }
};

exports.From2D = {
  nodetype: "From2D",
  descr: "Converts x and y indices into an one-dimensional index",
  path: __filename,
  inputs: {
    x: {type: Type.NUM, defaultValue: 0},
    y: {type: Type.NUM, defaultValue: 0},
    width: {type: Type.INT, defaultValue: 2}
  },
  outputs: {
    index: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports) {
    ports.index.set((ports.y.get() >>> 0) * ports.width.get() + (ports.x.get() >>> 0));
  }
};

// There are many ways to compute this, depending on rotation order, ranges, and handedness.
exports.AngleToPosition = {
  nodetype: "AngleToPosition",
  descr: "Converts pitch and yaw into an a 3D direction vector",
  path: __filename,
  inputs: {
    pitch: {type: Type.FLOAT, defaultValue: 0},
    yaw: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    x: {type: Type.FLOAT, defaultValue: 0},
    y: {type: Type.FLOAT, defaultValue: 0},
    z: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports) {
    var ap = ports.pitch.get() * Math.PI;
    var ay = ports.yaw.get() * Math.PI;
    var cosPitch = Math.cos(ap);
    ports.x.set(Math.cos(ay) * cosPitch);
    ports.y.set(Math.sin(ay) * cosPitch);
    ports.z.set(Math.sin(ap));
  }
};

exports.Counter = {
  nodetype: "Counter",
  descr: "Increments output each time input is triggered.",
  path: __filename,
  initFn: function (ports, state, name, emitter) {
    state.count = 0;
  },
  procfn : function(ports,state, id, triggerPort) {
    if (ports.reset.get()) {
      state.count = 0;
    }
    else if (triggerPort !== ports.reset && triggerPort !== ports.enabled && triggerPort.get() > triggerPort.previousValue) {
		state.count++;
	}
    
    if (!!+ports.enabled.get()) {
      ports.count.set(state.count);
    }

    return state;
  },
  inputs: {
    i1: {type: Type.ANY, defaultValue: 0},
    enabled: {type: Type.BOOL, defaultValue: true},
    reset: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    count: {type: Type.INT, defaultValue: 0 }
  },
  variadicInput: true
};


exports.Tally = {
  nodetype: "Tally",
  descr: "Returns the number of active inputs.",
  path: __filename,
  inputs: {
/*  LATER: Add a window size?
  window: {type: Type.FLOAT, defaultValue: 0.5}, */
    // We also might want a version of Tally without a threshold that counts the presence or truthiness of any argument.
    threshold: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    i1: {type: Type.FLOAT, defaultValue: 0},
    i2: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    tally: {type: Type.INT, defaultValue: 0},
    propTally: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.inputs = 0;
    for (var p in ports) {
      if (ports[p].direction === "INPUT" && !ports[p].fixed) {
        state.inputs++;
      }
    }
  },
  tick: function (ports, state, id, tickData) {
    var count = 0;
    for (var p in this.inputs) {
      if (ports[p] > ports.threshold.get()) {
        count++;
      }
    }
    ports.tally.set(count);
    ports.propTally.set(count / state.inputs);
  }
};


exports.Trigger = {
  nodetype: "Trigger",
  descr: "On trigger input, sends fixed output as specified by passthrough input.",
  path: __filename,
  inputs: {
    trigger: {type: Type.ANY, defaultValue: 0},
    triggerOn: {type: Type.ANY, defaultValue: 1},
    input: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if ((triggerPort === ports.trigger) && (triggerPort.get() == ports.triggerOn.get())) {
      ports.output.set(ports.input.get());
    }
  }
};

exports.Merge = {   
  nodetype: "Merge",
  descr: "Asynchronously passes the most recently changed input.",
  path: __filename,
  inputs: {
    i1: {type: Type.ANY, defaultValue: 0},
    i2: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state, name, triggerPort) {
    ports.output.set(triggerPort.get());
  },
  variadicInput: true
};

/* Duplicates functionality of StreamMerger and Merge */
exports.Interleaver = exports.Merge;

exports.RunningAverage = {
  nodetype: "RunningAverage",
  descr: "Computes a running average of the input",
  path: __filename,
  initFn: function (ports, state) {
    state.average = 0;
  },
  inputs: {
    in: {type: Type.NUM, defaultValue: 0, continutous : true},
    weight: {type: Type.FLOAT, defaultValue: 0.05}
  },
  outputs: {
    average: {type: Type.FLOAT, defaultValue: 1},
  },
  tick: function (ports, state) {
    var w = ports.weight.get();
    state.average = w * ports.in.get() + (1 - w) * state.average;
    if (Math.abs(state.average) < 0.0000001) {
      state.average = 0;
    }
    ports.average.set(state.average);
  },
  procfn: function () {}
};


exports.Accumulator = {
  nodetype: "Accumulator",
  descr: "Accumulates input over time and decays at a specified rate.",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0, continuous: true},
    influence: {type: Type.FLOAT, defaultValue: 1},
    decay: {type: Type.FLOAT, defaultValue: 0.5},
    // continuousDecay: {type: Type.BOOL, defaultValue: true}
    continuous: {type: Type.BOOL, defaultValue: true}
  },
  outputs: {
    accum: {type: Type.FLOAT, defaultValue: 0},
  },
  initFn: function (ports, state) {
    state.value = 0;
  },
  procfn: function (ports, state) {
    if (ports.continuous.get()) {
      // state.value = ports.influence.get() * ports.in.get() + ports.accum.get();
      // ports.accum.set(state.value);
    }
    else {
      var decay = ports.decay.get();
      state.value = ports.influence.get() * ports.in.get() + (1 - decay) * state.value;
      ports.accum.set(state.value);
    }
  },
  tick: function (ports, state) {
    if (ports.continuous.get()) {
      // state.value *= (1 - ports.decay.get());
      state.value = (ports.influence.get() * ports.in.get()) + (state.value * ports.decay.get());
      ports.accum.set(state.value);
    }
  }
};

exports.Ramp = {
  nodetype: "Ramp",
  descr: "Increases and decreases the value by different amounts based on input",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0, continuous: true},
    up: {type: Type.FLOAT, defaultValue: 0.003},
    down: {type: Type.FLOAT, defaultValue: 0.01},
    min: {type: Type.NUM, defaultValue: 0},
    max: {type: Type.NUM, defaultValue: 1},
    clip: {type: Type.BOOL, defaultValue: true}
  },
  outputs: {
    ramped: {type: Type.FLOAT, defaultValue: 0},
  },
  initFn: function (ports, state) {
    state.value = 0;
  },
  tick: function (ports, state) {
    var value = ports.in.get();
    if (ports.min.get() !== ports.max.get()) {
      state.value += MathUtil.scale(value, ports.max.get(), ports.min.get(), ports.up.get(), -ports.down.get());
      if (ports.clip.get()) {
        state.value = MathUtil.clip(state.value, ports.min.get(), ports.max.get());
      }
    }
    ports.ramped.set(state.value);
  }
};

// TODO: Can these be variadic?
exports.Inlet = {
  nodetype: "Inlet",
  descr: "Allows publishing inputs of a ContainerMapNode.",
  path: __filename,
  procfn : function(ports,state) {
    ports.o1.set(ports.i1.get());
  },
  inputs: {
    i1 : { type : Type.EXT, defaultValue : 0 },
  },
  outputs : {
    o1: { type : Type.INT, defaultValue : 0 }
  }
};


exports.Outlet = {
  nodetype: "Outlet",
  descr: "Allows publishing outputs of a ContainerMapNode.",
  path: __filename,
  procfn : function(ports,state) {
    ports.o1.set(ports.i1.get());
  },
  inputs: {
    i1 : { type : Type.INT, defaultValue : 0, continuous: true},
  },
  outputs : {
    o1: { type : Type.EXT, defaultValue : 0, continuous: true }
  }
};


exports.Threshold = {
  nodetype: "Threshold",
  descr: "Basic threshold detector",
  path: __filename,
  inputs: {
    dataInput: {type: Type.NUM, defaultValue: 0},
    threshold: {type: Type.NUM, defaultValue: 0.5},
  },
  outputs : {
    overThreshold : {type: Type.INT, defaultValue: 0},
    underThreshold : {type: Type.INT, defaultValue: 1},
  },
  procfn: function(ports,state) {
    if (ports.dataInput.get() >= ports.threshold.get()) {
      ports.overThreshold.set(1);
      ports.underThreshold.set(0);
    } else {
      ports.overThreshold.set(0);
      ports.underThreshold.set(1);
    }
  }
};


exports.Debounce = {
  nodetype: "Debounce",
  descr: "Passes changes only if a given period of time has elapsed since the input.",
  path: __filename,
  inputs: {
    value: {type: Type.ANY, defaultValue: 0},
    interval: {type: Type.FLOAT, defaultValue: 0.3},
    sensitivity: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.ANY, defaultValue: 0}
  },
  initFn: function(ports, state, name, emt) {
    state.lastTime = 0;
    state.lastValue = null;
  },
  tick: function (ports, state, id, tickData) {
    if (state.lastValue !== null && (tickData.seconds - state.lastTime) > ports.interval.get()) {
      state.lastTime = tickData.seconds;
      ports.output.set(state.lastValue);
      state.lastValue = null;
    }
  },
  procfn: function(ports, state, id, triggerPort) {
    if (triggerPort === ports.value) {
      var v = triggerPort.get();
      var t = ports.sensitivity.get();
      if (t > 0 && Math.abs(v - state.lastValue) > t) {
        ports.output.set(v);
      }
      state.lastValue = v;
    }
  }
};


exports.Derivative = {
  nodetype: "Derivative",
  descr: "Differentiates the input value",
  path: __filename,
  inputs: {
    value: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.NUM, defaultValue: 0}
  },
  initFn: function (ports, state, name, emt) {
    state.lastValue = 0;
  },
  procfn: function (ports, state, id, triggerPort) {
    var v = triggerPort.get();
    ports.output.set(v - state.lastValue);
    state.lastValue = v;
  }
};

exports.Switch = {
  nodetype: "Switch",
  descr: "Turns things on or off.",
  path: __filename,
  inputs: {
    switch: {type: Type.BOOL, defaultValue: false, fixed: true}
  },
  outputs: {
    on: {type: Type.BOOL, defaultValue: false}
  },
  procfn: function (ports, state, id, triggerPort) {
    var switched = ports.switch.get();
    ports.on.set((switched !== "false") && (switched !== "0") && !!switched);
  }
};

exports.FlipFlop = {
  nodetype: "FlipFlop",
  descr: "Changes state on input.",
  path: __filename,
  inputs: {
    input: {type: Type.ANY, defaultValue: false, fixed: true}
  },
  outputs: {
    on: {type: Type.BOOL, defaultValue: false}
  },
  //potential bug! ports.input.get()
  procfn: function (ports, state, id, triggerPort) {
    ports.on.set(!ports.input.get());
  }
};

exports.Button = {
  nodetype: "Button",
  descr: "Momentarily bangs.",
  path: __filename,
  inputs: {
    button: {type: Type.BOOL, defaultValue: false, fixed: true},
    sendOff: {type: Type.BOOL, defaultValue: true, fixed: true}
    // The idea of sendOff is to choose whether or not to set output to false. For triggered things that only look at the triggered port for a bang, this will bang twice (once for on and once for off), when enabled. However, for sendOff===false, triggered ports would only fire if they're continuous===true.
  },
  outputs: {
    on: {type: Type.BOOL, defaultValue: false}
  },
  procfn: function (ports, state, id, triggerPort) {
    var t = ports.button.get();
    t = (t !== "true") && !!t;
    if (ports.sendOff.get()) {
      // process.nextTick(buttonOff)
      ports.on.set(t);
    }
    else if (t) {
      ports.on.set(t);
    }
    //Potential bug. Did we mean ports.on.set?
    ports.button.set(false);
  }
};

exports.Enable = {
  nodetype: "Enable",
  descr: "Passes input when enabled.",
  path: __filename,
  inputs: {
    enable: {type: Type.BOOL, defaultValue: false, fixed: true},
    input: {type: Type.ANY, defaultValue: 0, continuous: true}
  },
  outputs: {
    value: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    // if (triggerPort.name !== "enable" && ports.enable.get()) {
    var enabled = ports.enable.get();
    if ((enabled !== "false") && (enabled !== "0") && !!enabled) {
      ports.value.set(ports.input.get());
    }
  }
};

exports.Absorb = {
  nodetype: "Absorb",
  descr: "Passes input when banged.",
  path: __filename,
  inputs: {
    emit: {type: Type.BOOL, defaultValue: false, fixed: true},
    input: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    value: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort.name === "emit" && triggerPort.get()) {
      ports.value.set(ports.input.get());
    }
  }
};

exports.Select = {
  nodetype: "Select",
  descr: "Passes a selected input",
  path: __filename,
  inputs: {
    selector: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    i1: {type: Type.ANY, defaultValue: 0},
    i2: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.ANY, defaultValue: 0}
  },
  initFn: function (ports, state, name, emt) {
    state.inputs = [];
    for (var p in ports) {
      var port = ports[p];
      // if (!port.fixed && port.direction === Direction.INPUT) {
      // if (!port.fixed &qw& port.direction === "INPUT") {
      // The fixed flag doesn't seem to be preseved when the node is edited (to add more inputs, for example), so then the text for fixed on re-initFn() fails.
      if (port.direction === "INPUT" && port.name !== "selector") {
        state.inputs.push(port);
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var selection = Number.parseFloat(ports.selector.get());
    if (!Number.isNaN(selection)) {
      if (selection < 0) {selection = 0;}
      if (selection >= 1) {selection = 1 - Number.EPSILON;}
      ports.output.set(state.inputs[Math.floor(selection * state.inputs.length)].get());
    }
  },
  variadicInput: true
};


exports.SelectIndexed = {
  nodetype: "SelectIndexed",
  descr: "Pass a selected input",
  inputs: {
    selector: {type: Type.INT, defaultValue: 0, fixed: true},
    modular: {type: Type.BOOL, defaultValue: false, fixed: true},
    i1: {type: Type.ANY, defaultValue: 0},
    i2: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.ANY, defaultValue: 0}
  },
  initFn: function (ports, state, name, emt) {
    state.inputs = [];
    for (var p in ports) {
      
      var port = ports[p];
      // if (!port.fixed && port.direction === Direction.INPUT) {
      if (!port.fixed && port.direction === "INPUT") {
        state.inputs.push(port);
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var selection = Math.floor(ports.selector.get());
    if (selection < 0) {selection = 0;}
    if (ports.modular.get()) {
      selection %= state.inputs.length;
    }
    else {
      if (selection >= state.inputs.length) {
        selection = state.inputs.length - 1;
      }
    }
    ports.output.set(state.inputs[selection].get());
  },
  variadicInput: true
};

exports.Span = {
  nodetype: "Span",
  descr: "Continuously interpolate through inputs",
  path: __filename,
  inputs: {
    selector: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    i1: {type: Type.NUM, defaultValue: 0},
    i2: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.NUM, defaultValue: 0}
  },
  initFn: function (ports, state, name, emt) {
    state.inputs = [];
    for (var p in ports) {
      var port = ports[p];
      if (!port.fixed && port.direction === "INPUT") {
        state.inputs.push(port);
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var l = state.inputs.length;
    var selection = ports.selector.get();
    selection = MathUtil.clip(selection, 0, 1 - Number.EPSILON) * (l - 1);
    var iLow = Math.floor(selection);
    var valLow = Number.parseFloat(state.inputs[iLow].get());
    if (l === 1 || (iLow === (l - 1))) {
      ports.output.set(valLow);
    }
    else {
      var valHigh = state.inputs[iLow + 1].get();
      ports.output.set(MathUtil.scale(selection, iLow, iLow + 1, valLow, valHigh));
    }
    return state;
  },
  variadicInput: true
};

exports.Splay = {
  nodetype: "Splay",
  descr: "Distribute to selected output",
  path: __filename,
  inputs: {
    selector: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    value: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    o1: {type: Type.ANY, defaultValue: 0},
    o2: {type: Type.ANY, defaultValue: 0}
  },
  initFn: function (ports, state, name, emt) {
    state.outputs = [];
    for (var p in ports) {
      var port = ports[p];
      // if (!port.fixed && port.direction === Direction.OUTPUT) {
      if (!port.fixed && port.direction === "OUTPUT") {
        state.outputs.push(port);
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var selection = ports.selector.get();
    selection = MathUtil.clip(selection, 0, 1 - Number.EPSILON);
    state.outputs[Math.floor(selection * state.outputs.length)].set(ports.value.get());
  },
  variadicOutput: true
};

exports.SplayIndexed = {
  nodetype: "SplayIndexed",
  descr: "Distribute to selected output",
  inputs: {
    selector: {type: Type.INT, defaultValue: 0, fixed: true},
    modular: {type: Type.BOOL, defaultValue: false, fixed: true},
    value: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    o1: {type: Type.ANY, defaultValue: 0},
    o2: {type: Type.ANY, defaultValue: 0}
  },
  initFn: function (ports, state, name, emt) {
    state.outputs = [];
    for (var p in ports) {
      var port = ports[p];
      if (!port.fixed && port.direction === "OUTPUT") {
        state.outputs.push(port);
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var selection = Math.floor(ports.selector.get());
    if (ports.modular.get()) {
      selection %= state.outputs.length;
      while (selection < 0) {
        selection += state.outputs.length;
      }
    }
    else {
      selection = MathUtil.clip(selection, 0, state.outputs.length - 1);
    }
    state.outputs[selection].set(ports.value.get());
  },
  variadicOutput: true
};

// Do we need this? This is essentially just a Span with two inputs.
exports.Mix = {
  nodetype: "Mix",
  descr: "Combines the value of two inputs",
  path: __filename,
  inputs: {
    alpha: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    a: {type: Type.NUM, defaultValue: 0, fixed: true},
    b: {type: Type.NUM, defaultValue: 0, fixed: true}
  },
  outputs: {
    mix: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    var alpha = MathUtil.clip(ports.alpha.get(), 0, 1);
    ports.mix.set(MathUtil.lerp(alpha, ports.a.get(), ports.b.get()));
  }
};

exports.Toggle = {
  nodetype: "Toggle",
  descr: "Select one of two inputs.",
  path: __filename,
  inputs: {
    switch: {type: Type.BOOL, defaultValue: false},
    onValue: {type: Type.ANY, defaultValue: 1},
    offValue: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    result: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var switched = ports.switch.get();
    ports.result.set(((switched !== "false") && (switched !== "0") && !!switched) ? ports.onValue.get() : ports.offValue.get());
  }
};

exports.KeyedSelect = {
  nodetype: "KeyedSelect",
  descr: "Select output based on input name.",
  path: __filename,
  inputs: {
    select: {type: Type.STRING, defaultValue: 0, fixed: true}
  },
  outputs: {
    result: {type: Type.ANY, defaultValue: 0, fixed: true}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.select) {
      var p = ports[ports.select.get()];
      if (p) {
        ports.result.set(p.get());
      }
    }
    else if (triggerPort.name === ports.select.get()) {
      ports.result.set(triggerPort.get());
    }
  },
  variadicInput: true
};

exports.Impulse = {
  nodetype: "Impulse",
  descr: "If input is <sensitivity> over threshold",
  path: __filename,
  inputs: {
    dataInput: {type: Type.NUM, defaultValue: 0},
    threshold: {type: Type.NUM, defaultValue: 0.5},
    outputWhenEnabled: {type: Type.NUM, defaultValue: 1},
    outputWhenDisabled: {type: Type.NUM, defaultValue: 0},
    sensitivity: {type: Type.NUM, defaultValue: 0.05},
  },
  outputs: {
    dataOutput: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function(ports,state) {
    var value = ports.dataInput.get();
    var threshold = ports.threshold.get();
    var sensitivity = ports.sensitivity.get();
    var activeLow = (sensitivity < 0.0);
    sensitivity = Math.abs(sensitivity);

    var passed = (activeLow) ? (value - threshold) < sensitivity : (value - threshold) > sensitivity;

    if (!state.passed && passed) {
      ports.dataOutput.set(ports.outputWhenEnabled.get());
    } else {
      ports.dataOutput.set(ports.outputWhenDisabled.get());
    }

    state.passed = passed;
    return state;
  }
};

// The original Hold had a time parameter, but we have Debounce for that.
exports.Latch = {
  nodetype: "Latch",
  descr: "Holds a value after a change of particular amount",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0},
    sensitivity: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    value: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports, state) {
    if (Math.abs(ports.in.get() - ports.value.get()) > ports.sensitivity.get()) {
      ports.value.set(ports.in.get());
    }
  }
};

exports.Distribution = {
  nodetype: "Distribution",
  descr: "Emits values within a distribution",
  path: __filename,
  inputs: {
    trigger: {type: Type.ANY, defaultValue: 0},
    center: {type: Type.NUM, defaultValue: 0},
    width: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    output: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function(ports, state, id, triggerPort) {
    if (triggerPort.name === "trigger") {
      ports.output.set(ports.center.get() + (Math.random() - 0.5) * ports.width.get());
    }
  }
};

exports.Similarity = {
  nodetype: "Similarity",
  descr: "Computes a metric of how similar the inputs are",
  inputs: {
    i1: {type: Type.FLOAT, defaultValue: 0},
    i2: {type: Type.FLOAT, defaultValue: 0},
    extent: {type: Type.FLOAT, defaultValue: 1}
  },
  outputs: {
    similarity: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var v = 1.0 - Math.abs(ports.i1.get() - ports.i2.get()) / ports.extent.get();
    ports.similarity.set(v);
  }
};

exports.Converge = {
  nodetype: "Converge",
  descr: "Computes a rate given the current rate and position and target that will cause the source to reach its target",
  inputs: {
    inRate: {type: Type.FLOAT, defaultValue: 1},
    position: {type: Type.FLOAT, defaultValue: 0},
    target: {type: Type.FLOAT, defaultValue: 0},
    alpha: {type: Type.FLOAT, defaultValue: 0.1},
    minRate: {type: Type.FLOAT, defaultValue: 0.1},
    maxRate: {type: Type.FLOAT, defaultValue: 2}
  },
  outputs: {
    outRate: {type: Type.FLOAT, defaultValue: 1}
  },
  procfn: function (ports, state, id, triggerPort) {
//    if (triggerPort === ports.position) {
//      
//    }
    // In theory, this should only need to be called when one of the inputs changes,
    // but because it is used in a feedback loop, and it is asynchronous, we end up
    // comparing values from different times, which makes it compute incorrect corrections.
  },
  tick: function (ports, state, id, tickData) {
    var error = (ports.target.get() - ports.position.get()) / 1000;
    var alpha = ports.alpha.get();
    var outRate = (1 - alpha) * ports.inRate.get() + alpha * (error);
    ports.outRate.set(MathUtil.clip(outRate, ports.minRate.get(), ports.maxRate.get()));
  }
};

exports.DataRateMeasure = {
  nodetype: "DataRateMeasure",
  descr: "Measures rate of incoming data",
  path: __filename,
  inputs: {
    input: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    rate: {type: Type.INT, defaultValue: 0}
  },
  initFn : function(ports,state, name, emt) {
    state.lastTime = 0;
  },
  procfn: function(ports, state) {
    state.count += 1;
  },
  tick: function(ports, state, id, tickData) {
    var d = tickData.seconds - state.lastTime;
    if (d >= 1) {
      ports.rate.set(state.count / (d));
      state.count = 0;
      state.lastTime = tickData.seconds;
    }
  }
};

exports.EventRate_Old = {
  nodetype: "EventRate_Old",
  descr: "Measures rate of incoming data over a threshold",
  path: __filename,
  inputs: {
    input: {type: Type.ANY, defaultValue: 0},
    threshold: {type: Type.FLOAT, defaultValue: 0},
    window: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    rate: {type: Type.FLOAT, defaultValue: 0},
  },
  initFn : function(ports,state, name, emt) {
    state.lastTime = 0;
    state.buffer = [];
  },
  procfn: function(ports, state, id, triggerPort) {
    if (triggerPort.name === "input") {
      var v = triggerPort.get();
      if (typeof v === "number") {
        if (v > ports.threshold.get()) {
          state.buffer[state.buffer.length - 1] += 1;
        }
      }
      else {
        state.buffer[state.buffer.length - 1] += 1;
      }
    }
  },
  tick: function(ports, state, id, tickData) {
    var buf = state.buffer;
    if (buf.length > 0) { 
      // The sum could be computed by adding the value on push() and subtracting values on shift()
      var sum = buf.reduce(function(total, num) { return total + num;});
      // ports.rate.set((sum / buf.length) * (1000 / tickData.interval));
      ports.rate.set(sum / (buf.length / (1000 / tickData.interval)));
      // console.log("Sum: " + sum + ", Interval: " + tickData.interval + " Buflen: " + buf.length + " seconds: " + (buf.length / (1000 / tickData.interval)));
    }
    while (buf.length > ports.window.get()) {
      buf.shift();
    }
    buf.push(0);
  }
};

exports.EventRate = {
  nodetype: "EventRate",
  descr: "Measures rate of incoming data over a threshold",
  path: __filename,
  inputs: {
    input: {type: Type.ANY, defaultValue: 0},
    threshold: {type: Type.FLOAT, defaultValue: 0},
    windowSeconds: {type: Type.FLOAT, defaultValue: 5}
  },
  outputs: {
    rate: {type: Type.FLOAT, defaultValue: 0},
  },
  initFn : function(ports,state, name, emt) {
    state.lastTime = 0;
    state.buffer = [Date.now()];
  },
  procfn: function(ports, state, id, triggerPort) {
    if (triggerPort.name === "input") {
      var v = triggerPort.get();
      var now = process.hrtime();
      if (typeof v === "number") {
        if (v > ports.threshold.get()) {
          // state.buffer.push(Date.now());
          state.buffer.push(now[0] * 1000 + now[1] / 1000000);
        }
      }
      else {
        // state.buffer.push(Date.now());
        state.buffer.push(now[0] * 1000 + now[1] / 1000000);
      }
    }
  },
  tick: function(ports, state, id, tickData) {
    var buf = state.buffer;
    if (buf.length > 0) { 
      // The sum could be computed by adding the value on push() and subtracting values on shift()
      var endVal = buf[buf.length - 1];
      var startVal = buf[0];
      //is not used
      var delta = endVal - startVal;
      var window = ports.windowSeconds.get() * 1000;
      // ports.rate.set((sum / buf.length) * (1000 / tickData.interval));
      ports.rate.set(buf.length / (endVal - startVal) / 1000);
      // console.log("End: " + endVal + ", Start: " + startVal + " Buflen: " + buf.length);
      while ((endVal - buf[0]) > window) {
        buf.shift();
      }
    }
    else {
      ports.rate.set(0);
    }
    // buf.push(0);
  }
};
