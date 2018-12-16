var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;

var sineGenProcfn = function(ports,state) {
  var fps = ports.fps.get();
  var freq = ports.freq.get();
  var clearState = null;
  if (state.runningState === RunningState.INIT || clearState) {
    //l.debug("INIT STATE!!!=============");
//    state = {};
    state.genTimer = null;
    state.currentRad = 0;
    state.stepSize = (2*Math.PI * freq / fps);
    state.runningState = RunningState.RUNNING;
  }
  //l.info("Updating output "+ports.i1.get());
  state.stepSize = (2*Math.PI * freq / fps);
  state.currentRad += state.stepSize;
  // ports.sinewave.set((Math.sin(state.currentRad)/2)+0.5);
  if (0>Math.sin(state.currentRad + ports.phase.get() * Math.PI) * ports.amp.get()){
    ports.sinewave.set(0);
  }
  else{
    ports.sinewave.set(1);
  }
  //ports.sinewave.set(Math.sin(state.currentRad + ports.phase.get() * Math.PI) * ports.amp.get());
  // console.log(state.runningState);
  if (state.runningState === RunningState.RUNNING) {
    state.genTimer = setTimeout(sineGenProcfn,(1000/fps), ports, state);
  }
  else {
    clearTimeout(state.genTimer);
    state.genTimer = null;
    console.log(this.destroy);

  }
  // console.log("[Compute Module] Sine: " + state.currentRad);
  return state;
};


exports.SineGenerator = {
  nodetype: "SineGenerator",
  generator: true,
  descr: "Outputs a sine wave.",
  path: __filename,
  procfn : sineGenProcfn,
  inputs: {
    freq : { type : Type.FLOAT, defaultValue : 1 },
    amp: {type: Type.FLOAT, defaultValue: 1},
    phase: {type: Type.FLOAT, defaultValue: 0},
    fps: { type : Type.INT, defaultValue : 30 }
  },
  outputs : {
    sinewave: { type : Type.INT, defaultValue : 0 }
  }
};
