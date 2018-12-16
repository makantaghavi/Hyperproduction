var Type = require("hp/model/ports").Type;

exports.Mux = {
	nodetype: "Mux",
	descr: "Assembles inputs into objects which are sent over noodles",
	path: __filename,
	inputs: {
      i1: {type: Type.ANY, defaultValue: 0}
	},
	outputs: {
		muxOut: {type: Type.ANY, defaultValue: 0}
	},
	procfn: function(ports, state, id, triggerPort) {
		var tmp = {};
		tmp[triggerPort.name]=triggerPort.get();
		ports.muxOut.set(tmp);
	}
};

exports.SynchronizedMux = {
	nodetype: "SynchronizedMux",
	descr: "Assembles inputs into objects which are sent over noodles",
	path: __filename,
	inputs: {
      i1: {type: Type.ANY, defaultValue: 0}
	},
	outputs: {
      muxOut: {type: Type.ANY, defaultValue: 0}
	},
//	initFn: function(ports,state,name,emt) {
//      state.output = {};
//	},
//    tick: function (ports, state, id, tickData) {
//      // console.log("smux tick");
//      ports.muxOut.set(state.output);
//    },
	procfn: function(ports, state, id, triggerPort) {
      // state.output[triggerPort.name]=triggerPort.get();
      // ports.muxOut.set(state.output);
      var out = {};
      var p;
      for (var k in ports) {
        p = ports[k];
        if (p.direction === "INPUT") {
          out[k] = p.get();
        }
      }
      ports.muxOut.set(out);
	}
};

exports.TimedSynchronizedMux = {
  nodetype: "TimedSynchronizedMux",
  descr: "Assembles inputs into objects which are sent over noodles at a regular interval",
  path: __filename,
  inputs: {
    i1: {type: Type.ANY, defaultValue: 0}
  },
  outputs: {
    muxOut: {type: Type.ANY, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    
  },
  tick: function(ports, state, id, tickData) {
    var out = {};
    var p;
    for (var k in ports) {
      p = ports[k];
      if (p.direction === "INPUT") {
        out[k] = p.get();
      }
    }
    ports.muxOut.set(out);
  }
};

exports.Demux = {
	nodetype: "Demux",
	descr: "Takes an object and outputs data via ports named for the properties in the object",
	path: __filename,
	inputs: {
		demuxIn: {type: Type.ANY, defaultValue: 0}
	},
	outputs: {
	},
	procfn: function(ports, state, id, triggerPort) {
      var obj = triggerPort.get();
      for (var p in obj) {
        if (ports.hasOwnProperty(p)) {
          ports[p].set(obj[p]);
        }
      }
	}
};

exports.MuxFilter = {
  nodetype: "MuxFilter",
  descr: "Only passes properties of a mux that are named in the filter list.",
  inputs: {
    mux: {type: Type.MUX, defaultValue: {}},
    filterList: {type: Type.STRING, defaultValue: "*"}
  },
  outputs: {
    filteredMux: {type: Type.MUX, defaultValue: {}}
  },
  initFn: function (ports, state) {
    state.keys = null;
    var str = ports.filterList.get();
    if (typeof str === "string") {
      if (str === "*") {
        state.keys = "*";
      }
      else if (str.length < 1 || str === "-") {
        state.keys = null;
      }
      else {
        state.keys = {};
        str.split(/[ _:;,]/).forEach(function (el) {
          state.keys[el] = true;
        });
      }
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.mux) {
      var mux = ports.mux.get();
      if (state.keys === "*") {
        ports.filteredMux.set(mux);
      }
      else if (typeof state.keys !== "object") {
        ports.filteredMux.reset();
      }
      else {
        var out = {};
        var found = false;
        if (state.keys) {
          for (var k in mux) {
            if (state.keys.hasOwnProperty(k)) {
              out[k] = mux[k];
              found = true;
            }
          }
          if (found) {
            ports.filteredMux.set(out);
          }
        }
      }
    }
    else {
      var str = ports.filterList.get();
      if (typeof str === "string") {
        if (str === "*") {
          state.keys = "*";
        }
        else if (str.length < 1 || str === "-") {
          state.keys = null;
        }
        else {
          state.keys = {};
          str.split(/[ _:;,-]/).forEach(function (el) {
            state.keys[el] = true;
          });
        }
      }
    }
  }
};

exports.MuxExtract = {
  nodetype: "MuxExtract",
  descr: "Produces the named value of the specified members of the input mux.",
  path: __filename,
  inputs: {
    "mux": {type: Type.MUX, defaultValue: 0},
    "key": {type: Type.STRING, defaultValue: 0}
  },
  outputs: {
    "out": {type: Type.ANY, defaultValue: null}
  },
  procfn: function (ports, state, id, triggerPort) {
    var mux = ports.mux.get();
    var key = ports.key.get();
    if (typeof mux === "object") {
      for (var k in mux) {
        if (ports[k] && ports[k].direction === "OUTPUT" && mux[k].hasOwnProperty(key)) {
          ports[k].set(mux[k][key]);
          ports.out.set(mux[k][key]);
        }
      }
    }
  },
  variadicOutput: true
};
