var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;

////
//
// Fun with Envelopes!

var trigEnvelope = function(ports,state) {
  var value = ports.dataInput.get();
  var fps = ports.fps.get();
  var attackMs = ports.attackMs.get();
  var decayMs = ports.decayMs.get();
  var sustainVal = ports.sustainVal.get();
  var releaseMs = ports.releaseMs.get();
  var holdMs = ports.holdMs.get();
  var clearState = ports.clearState.get();
  var retrigger = ports.retrigger.get();

  var threshold = ports.threshold.get();
  var sensitivity = ports.sensitivity.get();
  var activeLow = (sensitivity < 0.0);
  sensitivity = Math.abs(sensitivity);

  if (state.runningState === RunningState.INIT || clearState) {
    //l.debug("INIT STATE!!!=============");
    state.passed = false;
    state.attackTimer = null;
    state.releaseTimer = true; //this is a hack to keep the release from running the first time 
    state.currentVal = 0;
    state.checkTimer = null;
    state.runningState = RunningState.RUNNING;
  }

  //l.debug("AAH NAN RELEASE COUNTER: "+state.releaseCounter);

  clearTimeout(state.checkTimer);
  if (state === RunningState.STOPPED) {
    return state;
  }

  var passed = (activeLow) ? (value - threshold) < sensitivity : (value - threshold) > sensitivity;
  
  if (!state.passed && passed) {
    //transition to active state, trigger the envelope!
    
    if (retrigger || (!state.attackTimer && state.releaseTimer == true)) {
      if (state.attackTimer) clearTimeout(state.attackTimer);
      if (state.releaseTimer) {
        clearTimeout(state.releaseTimer);
        state.releaseTimer = true;
      }

      //Setting up everything the attack, decay, release and sustain need to work
      state.attackStepSize = ((1000/fps) / attackMs) * (1-state.currentVal);
      state.decayStepSize = ((1000/fps) / decayMs) * (1-sustainVal);
      state.releaseStepSize = ((1000/fps) / releaseMs) * (sustainVal);

      state.attackCounter = attackMs / (1000/fps);
      state.releaseCounter = releaseMs / (1000/fps);
      state.decayCounter = decayMs / (1000/fps);
      state.holdCounter = holdMs / (1000/fps);


      state.attackTimer = setTimeout(attackDecayGenerator, 0, ports, state);
    }

  } else if (value < threshold) {
    //l.debug("val < thresh");
    //l.debug(state.attackTimer);
    //l.debug(state.releaseTimer);
    //release detected, trigger the release, but wait for any attack to finish!
    if (!state.attackTimer && !state.releaseTimer) state.releaseTimer = setTimeout(releaseGenerator, 0, ports, state);
    else state.checkTimer = setTimeout(trigEnvelope,(1000/fps), ports, state);
  }

  return state;
}

var attackDecayGenerator = function(ports, state) {
  //l.debug("Att: "+state.currentVal);

  if (state.attackCounter > 0) {
    state.currentVal = state.currentVal + state.attackStepSize;
    ports.dataOutput.set(state.currentVal);
    state.attackCounter -= 1;
  } else if (state.attackCounter == 0) {
    state.currentVal = 1.0;
    ports.dataOutput.set(state.currentVal);
    state.attackCounter -= 1;

  } else if (state.holdCounter > 0) {
    ports.dataOutput.set(state.currentVal);
    state.holdCounter -= 1;
  } else if (state.holdCounter == 0) {
    ports.dataOutput.set(state.currentVal);
    state.holdCounter -= 1;


  } else if (state.decayCounter > 0) {
    state.currentVal = state.currentVal - state.decayStepSize;
    ports.dataOutput.set(state.currentVal);
    state.decayCounter -= 1;
  } else if (state.decayCounter == 0) {
    state.currentVal = ports.sustainVal.get();
    ports.dataOutput.set(state.currentVal);
    state.decayCounter -= 1;
  }  

  if (state.decayCounter < 0 && state.attackCounter < 0 ) { //&& state.holdCounter < 0) {
    state.attackTimer = null;
    state.releaseTimer = null;
  } else {
    state.attackTimer = setTimeout(attackDecayGenerator, (1000/ports.fps.get()), ports, state);
  }

  //l.debug(state.releaseTimer);
}

var releaseGenerator = function(ports, state) {
  //l.debug("Rel: "+state.currentVal);
  //l.debug(state.releaseCounter);
  if (state.releaseCounter > 0) {
    state.currentVal = state.currentVal - state.releaseStepSize;
    ports.dataOutput.set(Math.max(0,state.currentVal));
    state.releaseCounter -= 1;
  } else if (state.releaseCounter == 0 ) {
    state.currentVal = 0;
    ports.dataOutput.set(Math.max(0,state.currentVal));
    state.releaseCounter -= 1;
  } 

  if (state.releaseCounter < 0) {
    state.releaseTimer = true;
  } else {
    state.releaseTimer = setTimeout(releaseGenerator, (1000/ports.fps.get()), ports, state);
  }
}

exports.Envelope = {
  nodetype: "Envelope",
  descr: "On high input generates a fun envelope.",
  path: __filename,
  inputs: {
    dataInput: {type: Type.NUM, defaultValue: 0},
    threshold: {type: Type.NUM, defaultValue: 0.2},
    sensitivity: {type: Type.NUM, defaultValue: 0.5},
    attackMs: {type: Type.NUM, defaultValue: 5000},
    decayMs: {type: Type.NUM, defaultValue: 0},
    holdMs: {type: Type.NUM, defaultValue: 0},
    sustainVal: {type: Type.NUM, defaultValue: 1.0},
    releaseMs: {type: Type.NUM, defaultValue: 5000},
    fps: {type: Type.NUM, defaultValue: 25},
    clearState: {type: Type.BOOL, defaultValue:false},
    retrigger: {type: Type.BOOL, defaultValue:false},
  },
  outputs: {
    dataOutput: {type: Type.NUM, defaultValue: 0}
  },
  procfn: trigEnvelope
}