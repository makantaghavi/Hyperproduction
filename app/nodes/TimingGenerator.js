var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;

var timeGenProcfn = function(ports,state) {
  var fps = ports.fps.get();
  var clearState = null;
  if (state.runningState === RunningState.INIT || clearState) {
    //l.debug("INIT STATE!!!=============");
//    state = {};
    state.genTimer = null;
    state.runningState = RunningState.RUNNING;
  }
  //l.info("Updating output "+ports.i1.get());
  ports.timedOutput.set(ports.dataInput.get());
  // console.log(state.runningState);
  if (state.runningState === RunningState.RUNNING) {
    state.genTimer = setTimeout(timeGenProcfn,(1000/fps), ports, state);
  }
  else {
    clearTimeout(state.genTimer);
    state.genTimer = null;
    console.log(this.destroy);

  }
  // console.log("[Compute Module] Sine: " + state.currentRad);
  return state;
}


exports.TimingGenerator = {
  nodetype: "TimingGenerator",
  generator: true,
  descr: "Emits the input at a given interval.",
  path: __filename,
  procfn : timeGenProcfn,
  inputs: {
    dataInput: {type: Type.ANY, defaultValue: 0},
    fps: { type : Type.INT, defaultValue : 30 }
  },
  outputs : {
    timedOutput: { type : Type.INT, defaultValue : 0 }
  }
}

exports.Timing = {
  nodetype: "Timing",
  generator: true,
  descr: "Emits the input at each tick.",
  path: __filename,
  tick: function (ports) {
    ports.timedOutput.set(ports.dataInput.get());
  },
  inputs: {
    dataInput: {type: Type.ANY, defaultValue: 0},
  },
  outputs : {
    timedOutput: { type : Type.INT, defaultValue : 0 }
  }
};

exports.TimeFill = {
  nodetype: "TimeFill",
  generator: true,
  descr: "Emits the input as it arrives and pads on tick.",
  path: __filename,
  tick: function (ports) {
    ports.timedOutput.set(ports.dataInput.get());
  },
  procfn: function (ports) {
    ports.timedOutput.set(ports.dataInput.get());
  },
  inputs: {
    dataInput: {type: Type.ANY, defaultValue: 0},
  },
  outputs : {
    timedOutput: { type : Type.INT, defaultValue : 0 }
  }
};
