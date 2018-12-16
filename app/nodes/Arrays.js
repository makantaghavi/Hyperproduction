var Type = require("hp/model/ports").Type;
// var RunningState = require("hp/model/MapNode").RunningState;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

exports.SequenceRecognizer = {
  nodetype: "SequenceRecognizer",
  descr: "Sends an impulse when a sequence of values has been seen in the stream",
  path: __filename,
  inputs: {
    sequence: {type: Type.ARRAY, defaultValue: [0]}, // window? Or just use the length of the sequence?
    stream: {Type: Type.NUM, defaultValue: 0}
  },
  outputs: {
    seen: {Type: Type.BOOL, defaultValue: false}
  },
  initFn: function (ports, state) {
    state.stream = [];
  },
  procfn: function (ports, state, triggerPort) {
    if (triggerPort === ports.sequence) {
      // Store parsed sequence?
      state.sequence = ports.sequence.get();
      
    }
    else {
      // recognize the sequence
      state.stream.push(ports.stream.get());
      while (state.stream.length > state.sequence.length) {
        state.stream.shift();
        // LATER: This shifting in a loop is done in several places. It's probably more efficient to compute the number of nodes and perform one slice operation... for n-to-remove > 1-ish.
      }
      var equal = true;
      if (state.stream.length < state.sequence.length) {
        equal = false;
      }
      else {
        for (var i = 0; i < state.sequence.length; i++) {
          if (state.sequence[i] != state.stream[i]) {
            equal = false;
            break;
          }
        }
      }
      ports.seen.set(equal);
    }
  } 
};

exports.ParseArray = {
  nodetype: "ParseArray",
  descr: "Turns a formatted string into an array",
  path: __filename,
  inputs: {
    string: {type: Type.STRING, defaultValue: ""}
  },
  outputs: {
    array: {type: Type.ARRAY, defaultValue: []},
    length: {type: Type.INT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var str = ports.string.get();
    var array = str.split(/[,_ -]/).map(Number.parseFloat); // Probably need to try{} this?
    ports.array.set(array);
    ports.length.set(array.length);
  }
};

exports.ArraySelect = {
  nodetype: "ArraySelect",
  descr: "Emit the selected element from an array",
  inputs: {
    selector: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    index: {type: Type.INT, defaultValue: 0, fixed: true},
    modular: {type: Type.BOOL, defaultValue: false, fixed: true},
    array: {type: Type.ARRAY, defaultValue: [0]}
  },
  outputs: {
    output: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.selector || triggerPort === ports.index) {
      var arr = ports.array.get();
      if (Array.isArray(arr)) {
        var selection = (triggerPort === ports.selector) ? ~~(ports.selector.get() * arr.length) : ~~(ports.index.get());
        if (ports.modular.get()) {
          selection %= arr.length;
        }
        else {
          selection = MathUtil.clip(selection, 0, arr.length - 1);
        }
        ports.output.set(arr[selection]);
      }
      else {
        ports.output.set(arr);
      }
    }
  }
};

exports.ArraySpan = {
  nodetype: "ArraySpan",
  descr: "Continuously interpolate through elements of an array.",
  path: __filename,
  inputs: {
    selector: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    array: {type: Type.ARRAY, defaultValue: [0]},
  },
  outputs: {
    output: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    var ar = ports.array.get();
    var l = ar.length;
    if (l < 1) {
      return;
    }
    var selection = ports.selector.get();
    selection = MathUtil.clip(selection, 0, 1 - Number.EPSILON) * (l - 1);
    var iLow = Math.floor(selection);
    var valLow = Number.parseFloat(ar[iLow]);
    if (l === 1 || (iLow === (l - 1))) {
      ports.output.set(valLow);
    }
    else {
      var valHigh = ar[iLow + 1];
      ports.output.set(MathUtil.scale(selection, iLow, iLow + 1, valLow, valHigh));
    }
  }
};

exports.ArrayShuffle = {
  nodetype: "ArrayShuffle",
  descr: "Randomizes the order of elements in the array.",
  inputs: {
    shuffle: {type: Type.BOOL, defaultValue: false, fixed: true},
    array: {type: Type.ARRAY, defaultValue: [0], fixed: true}
  },
  outputs: {
    shuffled: {type: Type.ARRAY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort) {
      var arr = ports.array.get().slice();
      if (Array.isArray(arr)) {
        ports.shuffled.set(MathUtil.shuffle(arr));
      }
    }
  }
};

exports.ArrayIntRange = {
  nodetype: "ArrayRange",
  descr: "Creates an array of integer values between min and max.",
  inputs: {
    min: {type: Type.INT, defaultValue: 0, fixed: true},
    max: {type: Type.INT, defaultValue: 10, fixed: true}
  },
  outputs: {
    array: {type: Type.ARRAY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort) {
      ports.array.set(MathUtil.range(ports.min.get(), ports.max.get()));
    }
  }
};

exports.Filter = {
  nodetype: "Filter",
  descr: "Emits input only if they are contained in the array.",
  inputs: {
    test: {type: Type.NUM, defaultValue: 0, fixed: true},
    array: {type: Type.ARRAY, defaultValue: [], fixed: true}
  },
  outputs: {
    output: {type: Type.NUM, defaultValue: 0},
    has: {type: Type.BOOL, defaultValue: false}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.test) {
      var arr = ports.array.get();
      if (Array.isArray(arr)) {
        var value = ports.test.get();
        if (arr.indexOf(+value) > -1) {
          ports.output.set(value);
          ports.has.set(true);
        }
        else {
          ports.has.set(false);
        }
      }
      else {
        ports.has.set(false);
      }
    }
  }
};

exports.Fit = {
  nodetype: "Fit",
  descr: "Adjusts the input to the closest value in the array.",
  inputs: {
    test: {type: Type.NUM, defaultValue: 0, fixed: true},
    array: {type: Type.ARRAY, defaultValue: [0], fixed: true}
  },
  outputs: {
    output: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.array && Array.isArray(ports.array.get())) {
      state.array = ports.array.get().slice().sort(numericComparator);
    }
    var arr = state.array;
    var value = +ports.test.get();
    if (arr) {
      if (arr.length > 1) {
        var i = 1;
        while (value > +arr[i] && i < arr.length) {
          i++;
        }
        console.log(i + " - " + arr[i - 1] + " < " + value + " < " + arr[i] + " - " + Math.abs(value - +arr[i - 1]) + " ? " + Math.abs(value - +arr[i]));
        if (i >= arr.length) {
          ports.output.set(+arr[i - 1]);
        }
        else
        if (Math.abs(value - +arr[i - 1]) < Math.abs(value - +arr[i])) {
          ports.output.set(+arr[i - 1]);
        }
        else {
          ports.output.set(+arr[i]);
        }
      }
      else {
        ports.output.set(+arr[0]);
      }
    }
    else {
      ports.output.set(value);
    }
  }
};

function numericComparator(a, b) {
  return a - b;
}

// The defaultValue of ports.array should be [], but this was being removed during node editing, causing a syntax error
// [].toString() === ""
// JSON.stringify([]) === "[]"
exports.ArrayBuilder = {
  nodetype: "ArrayBuilder",
  descr: "Turns inputs into an array (not a Mux)",
  path: __filename,
  inputs: {
    i1: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    array: {type: Type.ARRAY, defaultValue: 0},
    length: {type: Type.INT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var a = [];
    for (var p in this.inputs) {
      a.push(ports[p].get());
    }
    ports.array.set(a);
    ports.length.set(a.length);
  }
};

exports.ArrayTranspose = {
  nodetype: "ArrayTranspose",
  descr: "Adds a value to existing array components.",
  path: __filename,
  inputs: {
    array: {type: Type.ANY, defaultValue: [0]},
    interval: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    transposed: {type: Type.OBJECT, defaultValue: {}}
  },
  procfn: function (ports, state, id, triggerPort) {
    var arr = ports.array.get().slice(0);
    var t = ports.interval.get();
    for (var i = 0; i < arr.length; i++) {
      arr[i] += t;
    }
    ports.transposed.set(arr);
  }
};