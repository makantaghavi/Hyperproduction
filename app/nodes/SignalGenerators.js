var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

// FIXME: The signal periods are not consistent across types.
exports.SignalGenerator = {
  nodetype: "SignalGenerator",
  generator: true,
  descr: "Outputs a signal [sine, square, triangle, sawtooth].",
  path: __filename,
  tick: function (ports, state, id, tickData) {
    var t = ports.freq.get() * tickData.seconds;
    // TODO: Use global tick and get seconds from that, so we don't need to keep rads and step sizes.
    // I think that the step approach is what might be causing some timing irregularities.
    switch (ports.signalType.get()) {
      case "square": // Square
        ports.signal.set(Math.sign(Math.sin(t + ports.phase.get() * 2 * MathUtil.TWO_PI)) * ports.amp.get());
        break;
      case "triangle": // Triangle
        // ports.signal.set(1 - 4 * Math.abs(Math.round(t - 0.25) - t - 0.25));
        ports.signal.set(Math.abs((t) % 4 - 2) - 1);
        break;
      case "sawtooth": // Sawtooth
        // ports.signal.set(2 * (t - Math.floor(t + 0.5)));
        t /= 2;
        ports.signal.set((t - Math.floor(t)) * 2 - 1);
        break;
      case "pulse": // Pulse
        ports.signal.set(Math.sin(t / MathUtil.TWO_PI) === 0 ? 1 : 0);
        break;
      case "sine":
        /* fall through */
      default:
        ports.signal.set(Math.sin(t + ports.phase.get() * MathUtil.TWO_PI) * ports.amp.get());
        break;
    }
    return state;
  },
  procfn: function () {
    
  },
  inputs: {
    freq: {
      type: Type.FLOAT,
      defaultValue: 1
    },
    amp: {
      type: Type.FLOAT,
      defaultValue: 1
    },
    phase: {
      type: Type.FLOAT,
      defaultValue: 0
    },
    signalType: {
      type: Type.STRING,
      defaultValue: "sine",
      enum: ["sine", "square", "triangle", "sawtooth"]
    }
  },
  outputs: {
    signal: {
      type: Type.FLOAT,
      defaultValue: 0
    }
  }
};

exports.Time = {
  nodetype: "Time",
  descr: "Outputs the current patch time in seconds",
  path: __filename,
  inputs: {},
  outputs: {
    time: {type: Type.FLOAT, defaultValue: 0},
    tick: {type: Type.FLOAT, defaultValue: 0},
    delta: {type: Type.FLOAT, defaultValue: 0}
  },
  tick: function (ports, state, id, tickData) {
    ports.time.set(tickData.seconds);
    ports.tick.set(tickData.currentTick);
    ports.delta.set(tickData.currentTick - tickData.prevTick);
  },
  procfn: function () {}
};

exports.StopWatch = {
  nodetype: "StopWatch",
  descr: "Generates values over time.",
  path: __filename,
  inputs: {
    startTime: {type: Type.FLOAT, defaultValue: 0},
    endTime: {type: Type.FLOAT, defaultValue: 1},
    rate: {type: Type.FLOAT, defaultValue: 1},
    run: {type: Type.BOOL, defaultValue: false},
    loop: {type: Type.BOOL, defaultValue: false},
    reset: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    time: {type: Type.FLOAT, defaultValue: 0},
    loopCount: {type: Type.INT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.time = 0;
    state.end = 0;
  },
  tick: function (ports, state, id, tickData) {
    if (ports.run.get()) {
      state.time += (tickData.currentTick - tickData.prevTick) * ports.rate.get();
      if (state.time > state.end) {
        if (ports.loop.get()) {
          ports.loopCount.set(ports.loopCount.get() + 1);
          state.time = 0;
        }
        else {
          state.time = state.end;
        }
      }
      else if (state.time < 0) {
        if (ports.loop.get()) {
          ports.loopCount.set(ports.loopCount.get() + 1);
          state.time = state.end;
        }
        else {
          state.time = 0;
        }
      }
//      else {
//        state.time += (tickData.currentTick - tickData.prevTick) * ports.rate.get();
//      }
      ports.time.set(state.time + ports.startTime.get());
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.reset) {
      state.time = 0;
      ports.time.set(state.time + ports.startTime.get());
      ports.loopCount.set(0);
    }
    else if (triggerPort === ports.startTime) {
      state.end = ports.endTime.get() - ports.startTime.get();
      ports.time.set(state.time + ports.startTime.get());
    }
    else if (triggerPort === ports.endTime) {
      state.end = ports.endTime.get() - ports.startTime.get();
      state.time = Math.min(state.end, state.time);
      ports.time.set(state.time + ports.startTime.get());
    }
  }
};

exports.Random = {
  nodetype: "Random",
  descr: "Outputs random values [-1, 1]",
  path: __filename,
  inputs: {
    amplitude: {type: Type.FLOAT, defaultValue: 1}
  },
  outputs: {
    random: {type: Type.FLOAT, defaultValue: 0}
  },
  tick: function (ports, state, id, tickData) {
    ports.random.set(ports.amplitude.get() * (Math.random() * 2 - 1));
  },
  procfn: function () {}
};

exports.Noise = {
  nodetype: "Noise",
  descr: "Outputs simplex noise [-1, 1]",
  path: __filename,
  inputs: {
    scale: {type: Type.FLOAT, defaultValue: 5},
    amplitude: {type: Type.FLOAT, defaultValue: 1}
  },
  outputs: {
    noise: {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.noise = new Simple1DNoise();
  },
  tick: function (ports, state, id, tickData) {
    // LATER: Replace with a better noise function. This one seems to be unbounded, at times.
    // ports.noise.set(ports.amplitude.get() * MathUtil.interpNoise1D(tickData.seconds * ports.scale.get()));
    ports.noise.set(state.noise.getVal(tickData.seconds));
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.scale) {
      state.noise.setScale(ports.scale.get());
    }
    else if (triggerPort === ports.amplitude) {
      state.noise.setAmplitude(ports.amplitude.get());
    }
  }
};

exports.Particle = {
  nodetype: "Particle",
  descr: "Triggers a sequence of value changes",
  path: __filename,
  inputs: {
    trigger: {type: Type.BOOL, defaultValue: false},
    initial: {type: Type.FLOAT, defaultValue: 0},
    initialVar: {type: Type.FLOAT, defaultValue: 0},
    gravity: {type: Type.FLOAT, defaultValue: 0},
    gravityValue: {type: Type.FLOAT, defaultValue: 0},
    velocity: {type: Type.FLOAT, defaultValue: 0},
    velocityVar: {type: Type.FLOAT, defaultValue: 0},
    drag: {type: Type.FLOAT, defaultValue: 0},
    lifespan: {type: Type.INT, defaultValue: 1},
    lifespanVar: {type: Type.INT, defaultValue: 0},
    interval: {type: Type.INT, defaultValue: 1000},
    intervalVar: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    particles: {type: Type.FLOAT, defaultValue: 0},
    event: {type: Type.BOOL, defaultValue: false}
  },
  initFn: function (ports, state) {
    state.queue = [];
  },
  procfn: function (ports, state, id, triggerPort) {
    if  (triggerPort.name === "trigger" && triggerPort.get()) {
      state.queue.push({
        position: ports.initial.get() + (Math.random() * 2 - 1) * ports.initialVar.get(),
        velocity: ports.velocity.get() + (Math.random() * 2 - 1) * ports.velocityVar.get(),
        drag: ports.drag.get(),
        lifespan: 1000 * (ports.lifespan.get() + (Math.random() * 2 - 1) * ports.lifespanVar.get())
      });
    }
  },
  tick: function (ports, state, id, tickData) {
    var queue = state.queue;
//    while (queue.length > 0 && queue[0].start < tickData.currentTick) {
//      ports.noteOut.set(queue.shift());
//    }
    var p;
    var gravity = ports.gravity.get();
    var gravityValue = ports.gravityValue.get();
    for (var i = 0; i < queue.length; i++) {
      p = queue[i];
      console.log(p);
      if (p.lifespan < 0) {
        queue.splice(i, 1);
        i--; // Doing the removal here will skip the next, unless we adjust i to be incremented again.
      }
      else {
//        p.velocity += gravity * gravityValue;
//        p.position += p.drag * p.velocity;
        p.velocity -= p.drag;
        p.position = (gravity * gravityValue) + (1 - gravityValue) * p.position + p.velocity;
        p.lifespan -= tickData.delta;
        ports.particles.set(p.position);
      }
    }
    if (queue.length > 0) {
      ports.event.set(true);
    }
    else {
      ports.event.set(false);
    }
  }
};

var Simple1DNoise = function() {
    var MAX_VERTICES = 256;
    var MAX_VERTICES_MASK = MAX_VERTICES -1;
    var amplitude = 1;
    var scale = 1;

    var r = [];

    for ( var i = 0; i < MAX_VERTICES; ++i ) {
      r.push(Math.random());
    }

    var getVal = function( x ){
      var scaledX = x * scale;
      var xFloor = Math.floor(scaledX);
      var t = scaledX - xFloor;
      var tRemapSmoothstep = t * t * ( 3 - 2 * t );

      /// Modulo using &
      var xMin = xFloor & MAX_VERTICES_MASK;
      var xMax = ( xMin + 1 ) & MAX_VERTICES_MASK;

      var y = lerp( r[ xMin ], r[ xMax ], tRemapSmoothstep );

      return y * amplitude;
    };

    /**
    * Linear interpolation function.
    * @param a The lower integer value
    * @param b The upper integer value
    * @param t The value between the two
    * @returns {number}
    */
    var lerp = function(a, b, t ) {
      return a * ( 1 - t ) + b * t;
    };

    // return the API
    return {
      getVal: getVal,
      setAmplitude: function(newAmplitude) {
          amplitude = newAmplitude;
      },
      setScale: function(newScale) {
          scale = newScale;
      }
    };
};
