var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

exports.TweenRate = {
  nodetype: "TweenRate",
  descr: "Interpolates from the previous value to the current value at the given rate",
  path: __filename,
  inputs: {
    in: {type: Type.FLOAT, defaultValue: 0, continuous: false},
    rate: {type: Type.FLOAT, defaultValue: 1}
  },
  outputs : {
    out: {type: Type.FLOAT, defaultValue : 0},
    running: {type: Type.BOOL, defaultValue: false}
  },
  initFn: function (ports, state) {
    state.isRunning = false;
    state.value = 0;
    state.lastValue = 0;
  },
  procfn: function(ports, state, id, triggerPort, emitter) {
    if (triggerPort.name === "in") {
      state.isRunning = true;
      state.value = state.lastValue;
      state.sign = Math.sign(ports.in.get() - state.value);
      ports.running.set(state.isRunning);
    }
    return state;
  },
  tick: function (ports, state, id) {
    var rate = ports.rate.get();
    if (state.isRunning && rate > 0) {
      var target = ports.in.get();
      state.value += state.sign * rate;
      if (state.sign !== Math.sign(target - state.value)) {
        state.isRunning = false;
        state.value = target;
        state.lastValue = target;
        ports.running.set(state.isRunning);
      }
      ports.out.set(state.value);
    }
  }
};

exports.TweenTimed = {
  nodetype: "TweenTimed",
  descr: "Interpolates from the previous value to the current value in the given time",
  path: __filename,
  inputs: {
    in: {type: Type.FLOAT, defaultValue: 0, continuous: false},
    duration: {type: Type.FLOAT, defaultValue: 1}
  },
  outputs : {
    out: {type: Type.FLOAT, defaultValue : 0},
    running: {type: Type.BOOL, defaultValue: false}
  },
  initFn: function (ports, state) {
    state.isRunning = false;
    state.value = 0;
    state.lastValue = 0;
    state.startTime = -1;
  },
  procfn: function(ports, state, id, triggerPort, emitter) {
    if (triggerPort.name === "in") {
      if (state.isRunning) {
        state.lastValue = state.value;
      }
      else {
        state.value = state.lastValue;
      }
      state.isRunning = true;
      state.startTime = -1;
      ports.running.set(state.isRunning);
    }
    return state;
  },
  tick: function (ports, state, id, tickData) {
    var duration = ports.duration.get();
    if (state.isRunning && duration > 0) {
      if (state.startTime < 0) {
        state.startTime = tickData.seconds;
      }
      var target = ports.in.get();
      var progress = (tickData.seconds - state.startTime) / duration;
      state.value = MathUtil.lerp(progress, state.lastValue, target); 
      if (progress > 1.0) {
        state.isRunning = false;
        state.value = target;
        state.lastValue = target;
        state.startTime = -1;
        ports.running.set(state.isRunning);
      }
      ports.out.set(state.value);
    }
  }
};