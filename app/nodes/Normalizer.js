var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

exports.Normalizer = {
  nodetype: "Normalizer",
  descr: "Generates useful information about a data source.",
  path: __filename,
  deprecated: true,
  initFn: function (ports, state) {
    // VERIFY: adding initFn to initialise, since running state didn't seem to be handled.
    state.normPreviousValues=[];
    state.inputMin= Number.POSITIVE_INFINITY;
    state.inputMax= Number.NEGATIVE_INFINITY;
    state.runningState = RunningState.RUNNING;
  },
  tick: function(ports, state) {
    //Define inputs
    var dataSource = ports.dataInput.get();
    var windowSize = ports.windowSize.get();
    var clearState = ports.clearState.get();  

    //l.debug("=====================");
    //l.debug(state);
    //l.debug(clearState);

    //Define persistent state object
//    if (state.runningState === RunningState.RUNNING || clearState) {
//      //l.debug("INIT STATE!!!=============");
//      state.normPreviousValues=[];
//      state.inputMin= Number.POSITIVE_INFINITY;
//      state.inputMax= -Number.NEGATIVE_INFINITY;
//      state.runningState = RunningState.RUNNING;
//    }

    //l.debug("=====================");
    //l.debug(state);

    var inMin, inMax;
    if (clearState) {
      state.inputMin = Number.POSITIVE_INFINITY;
      state.inputMax = Number.NEGATIVE_INFINITY;
    }
    inMin = state.inputMin = ( dataSource < state.inputMin) ? dataSource : state.inputMin;
    inMax = state.inputMax = ( dataSource > state.inputMax) ? dataSource : state.inputMax;

    if (!ports.autoScale.get()) {
      inMin = ports.dataMin.get();
      inMax = ports.dataMax.get();
    }
    
    //Set up normalization
    // var signalRange = state.inputMax-state.inputMin; 
    // var normalizedInput = ((dataSource - state.inputMin) / signalRange) * 2 - 1;
    var normalizedInput = MathUtil.scale(dataSource, inMin, inMax, 0, 1);

    //Push new input into previousValues
    state.normPreviousValues.unshift(normalizedInput);

    //l.debug(state.previousValues);
    //l.debug(state.normPreviousValues);

    //l.debug("Signal Range: "+signalRange);

    //Remove data from queue while length is longer than windowSize
    while (state.normPreviousValues.length > windowSize) {
      state.normPreviousValues.pop();
    }

    var outputData = state.normPreviousValues;
    if (outputData.length > 0){ 
      var summedOutputData = outputData.reduce( function(total, num) { return total + num;});
      var mean = summedOutputData/outputData.length;
      //set output
      var max = Math.max.apply(null, outputData);
      var min = Math.min.apply(null, outputData);
      ports.scaledOutput.set(outputData[0]);
      ports.dxOutput.set(Math.abs(outputData[0] - outputData[1]));
      ports.ixOutput.set(summedOutputData);
      ports.minimum.set(min);
      ports.maximum.set(max);
      ports.mean.set(mean);
      ports.variance.set(max - min);
    }
    return state;
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.autoScale && ports.autoScale.get()) {
      state.inMin = ports.dataMin.get();
      state.inMax = ports.dataMax.get();
    }
  },
  inputs: {
    dataInput: {type: Type.NUM, defaultValue: 0},
    normalize: {type: Type.BOOL, defaultValue:true},
    windowSize: {type: Type.INT, defaultValue: 64},
    clearState: {type: Type.BOOL, defaultValue: false},
    dataMin: {type: Type.NUM, defaultValue: 0},
    dataMax: {type: Type.NUM, defaultValue: 1},
    autoScale: {type: Type.BOOL, defaultValue: true}
  },
  outputs: {
    scaledOutput: {type: Type.NUM, defaultValue: 0},
    dxOutput: {type: Type.NUM, defaultValue: 0},
    ixOutput: {type: Type.NUM, defaultValue: 0},
    minimum: {type: Type.NUM, defaultValue: 0},
    maximum: {type: Type.NUM, defaultValue: 0},
    mean: {type: Type.NUM, defaultValue: 0},
    variance: {type: Type.NUM, defaultValue: 0},
  }

};

exports.Average = {
  nodetype: "Average",
  descr: "Windowed low-pass",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0},
    window: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    average: {type: Type.NUM, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.buffer = [];
  },
  tick: function (ports, state) {
    var buf = state.buffer;
    while (buf.length > ports.window.get()) {
      buf.shift();
    }
    buf.push(ports.in.get());
    if (buf.length > 0) { 
      // The sum could be computed by adding the value on push() and subtracting values on shift()
      var sum = buf.reduce(function(total, num) { return total + num;});
      ports.average.set(sum / buf.length);
    }
  },
  procfn: function (ports, state, name, triggerPort) {
    var windowSize = ports.window.get();
    if (triggerPort === windowSize) {
      state.buffer.length = windowSize;
    }
  }
};

// TODO: Make delay work in seconds rather than samples?
exports.Delay = {
  nodetype: "Delay",
  descr: "Delay the output by a given number of samples",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0},
    window: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    delayed: {type: Type.NUM, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.buffer = [];
  },
  tick: function (ports, state) {
    var buf = state.buffer;
    while (buf.length > ports.window.get()) {
      buf.shift();
    }
    buf.push(ports.in.get());
    if (buf.length > 0) { 
       ports.delayed.set(buf[0]);
    }
  },
  procfn: function (ports, state, name, triggerPort) {
    var windowSize = ports.window.get();
    if (triggerPort === windowSize) {
      state.buffer.length = windowSize;
    }
  }
};
////////
exports.Scale = {
  nodetype: "Scale",
  descr: "Manually or automatically scales a node to the specified range",
  path: __filename,
  inputs: {
    value: {type: Type.FLOAT, defaultValue: 0},
    inMin: {type: Type.FLOAT, defaultValue: 0},
    inMax: {type: Type.FLOAT, defaultValue: 1},
    outMin: {type: Type.FLOAT, defaultValue: 0},
    outMax: {type: Type.FLOAT, defaultValue: 1},
    autoScale: {type: Type.BOOL, defaultValue: false},
    adjustScale: {type: Type.BOOL, defaultValue: false},
    clip: {type: Type.BOOL, defaultValue: false},
    reset: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    scaled: {type: Type.FLOAT, defaultValue: 0},
    min: {type: Type.FLOAT, defaultValue: 0},
    max: {type: Type.FLOAT, defaultValue: 1}
  },
  initFn: function (ports, state) {
    state.min = Number.POSITIVE_INFINITY;
    state.max = Number.NEGATIVE_INFINITY;
  },
  procfn: function (ports, state, name, triggerPort) {
    var pOutMin = ports.outMin.get();
    var pOutMax = ports.outMax.get();
    var pClipMin, pClipMax;
    if (triggerPort === ports.reset && ports.reset.get()) {
      state.min = Number.POSITIVE_INFINITY;
      state.max = Number.NEGATIVE_INFINITY;
    }
    var v = Number.parseFloat(ports.value.get());
    if (ports.adjustScale.get()) {
      if (v < state.min) {
        state.min = v;
        ports.min.set(v);
      }
      if (v > state.max) {
        state.max = v;
        ports.max.set(v);
      }
    }
    if (ports.autoScale.get()) {
      if (ports.clip.get()) {
        pClipMin = Math.min(pOutMin, pOutMax);
        pClipMax = Math.max(pOutMin, pOutMax);
        ports.scaled.set(MathUtil.clip(MathUtil.scale(v, state.min, state.max, pOutMin, pOutMax), pClipMin, pClipMax));
      }
      else {
        ports.scaled.set(MathUtil.scale(v, state.min, state.max, ports.outMin.get(), ports.outMax.get()));
      }
    }
    else {
      if (ports.clip.get()) {
        pClipMin = Math.min(pOutMin, pOutMax);
        pClipMax = Math.max(pOutMin, pOutMax);
        ports.scaled.set(MathUtil.clip(MathUtil.scale(v, ports.inMin.get(), ports.inMax.get(), ports.outMin.get(), ports.outMax.get()), pClipMin, pClipMax));
      }
      else {
        ports.scaled.set(MathUtil.scale(v, ports.inMin.get(), ports.inMax.get(), ports.outMin.get(), ports.outMax.get()));
      }
    }
  } 
};

exports.DataStream = {
  nodetype: "DataStream",
  descr: "Useful information about a stream of data",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0},
    threshold: {type: Type.FLOAT, defaultValue: 0.01},
    window: {type: Type.INT, defaultValue: 64},
    minRange: {type: Type.FLOAT, defaultValue: 0.0001},
    reset: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    normalized: {type: Type.NUM, defaultValue: 0},
    dx: {type: Type.NUM, defaultValue: 0},
    ix: {type: Type.NUM, defaultValue: 0},
    minimum: {type: Type.NUM, defaultValue: 0},
    maximum: {type: Type.NUM, defaultValue: 0},
    mean: {type: Type.NUM, defaultValue: 0},
    median: {type: Type.NUM, defaultValue: 0},
    variance: {type: Type.NUM, defaultValue: 0},
    inflections: {type: Type.INT, defaultValue: 0},
    rugosity: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    // Use circular buffers instead of pop/shift?
    state.buffer = [0];
    state.derivative = [0];
    state.integral = [0];
    state.mean = 0;
    state.min = 0;
    state.max = 1;
    state.area = 0;
    state.inflections = 0;
    state.offset = 0;
  },
  tick: function (ports, state) {
    var buf = state.buffer;
    var windowSize = ports.window.get();
    var offset = buf.length - 1;
    var prev = buf[offset], dPrev = state.derivative[offset], iPrev = state.integral[offset];
    var old = 0, dOld = 0, iOld = 0;
    var thresh = ports.threshold.get();
    
    // Clean up old datum
    if (buf.length > windowSize) {
      old = buf.shift();
      dOld = state.derivative.shift();
      iOld = state.integral.shift();
    }
    state.mean -= old / windowSize;
    state.area -= Math.abs(dOld);
    // if (Math.sign(dOld) !== Math.sign(dPrev)) {
    // if ((Math.sign(old) - Math.sign(buf[0])) < Number.EPSILON) {
    if (dOld * state.derivative[0] < 0) {
      state.inflections--;
    }
    
    // Add new datum
    var value = ports.in.get();
    buf.push(value);
    var dValue = value - prev;
    state.derivative.push(dValue);
    state.mean += value / windowSize;
    var iValue = iPrev + ((value - state.mean) + (prev - state.mean)) / 2;
    state.integral.push(iValue);
    state.area += Math.abs(dValue);
    // TODO: Verify threshold.
    // if (Math.sign(dValue) !== Math.sign(dPrev)) { // && dValue > thresh) {
    // if ((Math.sign(value) - Math.sign(prev)) < Number.EPSILON) {
    if (dValue * dPrev < 0) {
      state.inflections++;
    }
    state.max = Math.max.apply(null, buf);
    state.min = Math.min.apply(null, buf);
//    if (state.buf.length > 0) {
//      var sum = buf.reduce(function(total, num) { return total + num;});
//      ports.average.set(sum / buf.length);
//    }
    var norm = (value - state.min)  / Math.max(ports.minRange.get(), state.max - state.min);
    ports.normalized.set(norm > thresh ? norm : 0);
    ports.minimum.set(state.min);
    ports.maximum.set(state.max);
    // ports.area.set(state.area);
    ports.inflections.set(state.inflections / windowSize);
    ports.mean.set(state.mean);
    ports.median.set((state.max - state.min) / 2 + state.min);
    ports.dx.set(dValue);
    ports.ix.set(iValue);
    ports.variance.set(state.max - state.min);
    ports.rugosity.set(state.area / windowSize);
  },
  procfn: function (ports, state, name, triggerPort) {
    if (triggerPort === ports.window) {
      var windowSize = ports.window.get();
      state.buffer.length = windowSize;
      state.derivative.length = windowSize;
      state.integral.length = windowSize;
    }
    else if (triggerPort === ports.reset) {
      ports.in.set(0);
      state.buffer = [0];
      state.derivative = [0];
      state.integral = [0];
      state.mean = 0;
      state.min = 0;
      state.max = 1;
      state.area = 0;
      state.inflections = 0;
      state.offset = 0;
    }
  }
};

exports.RMS = {
  nodetype: "RMS",
  descr: "Computes the root mean square of values within a window.",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0},
    window: {type: Type.INT, defaultValue: 64},
    reset: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    rms: {type: Type.NUM, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.buffer = [0];
    state.sum = 0;
  },
  procfn: function (ports, state, name, triggerPort) {
    if (triggerPort === ports.reset) {
      state.buffer = [0];
      state.sum = 0;
    }
    else if (triggerPort === ports.window) {
      // state.buffer.length = ports.window.get();
    }
    else {
      var v = ports.in.get();
      state.buffer.push(v * v);
      state.sum += v * v;
      while (state.buffer.length > ports.window.get()) {
        state.sum -= state.buffer.shift();
      }
      ports.rms.set(Math.sqrt(state.sum / state.buffer.length));
    }
  }
};

exports.Inflection = {
  nodetype: "Inflection",
  descr: "Generates an impulse on an inflection in the input.",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0, continuous: true}
  },
  outputs: {
    inflection: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.prev = [0, 0, 0];
//    state.last = false;
  },
  procfn: function (ports, state, id, triggerPort) {
    state.prev.push(triggerPort.get());
    state.prev.shift();
    if (((state.prev[1] - state.prev[0]) * (state.prev[2] - state.prev[1])) < 0) {
//      if (!state.last) {
        ports.inflection.set(1);
//        state.last = true;
//      }
    }
    else {
      ports.inflection.set(0);
//      state.last = false;
    }
  }
};

exports.Flip = {
  nodetype: "Flip",
  descr: "Flips values over the specified horizontal axis.",
  path: __filename,
  inputs: {
    in: {type: Type.NUM, defaultValue: 0},
    axis: {type: Type.NUM, defaultValue: 0.5}
  },
  outputs: {
    flipped: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort.name === "in") {
      ports.flipped.set(-(ports.in.get() - ports.axis.get()) + ports.axis.get());
    }
  }
};

exports.HighPassFilter = {
  nodetype: "HighPassFilter",
  descr: "Computes the values of the inputs relative to their average over time.",
  path: __filename,
  inputs: {
    alpha: {type: Type.FLOAT, defaultValue: 0.8, fixed: true},
    i0: {type: Type.NUM, defaultValue: 0},
    i1: {type: Type.NUM, defaultValue: 0},
    i2: {type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    o0: {type: Type.FLOAT, defaultValue: 0},
    o1: {type: Type.FLOAT, defaultValue: 0},
    o2: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.values = {};
    for (var p in ports) {
      var port = ports[p];
      if (!port.fixed && port.direction === "INPUT") {
        state.values[p] = 0;
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (!triggerPort.fixed) {
      var sv = state.values[triggerPort.name];
      var v = triggerPort.get();
      sv = ports.alpha.get() * sv + (1 - ports.alpha.get()) * v;
      state.values[triggerPort.name] = sv;
      ports[triggerPort.name.replace('i', 'o')].set(v - sv);
    }
  }
};
