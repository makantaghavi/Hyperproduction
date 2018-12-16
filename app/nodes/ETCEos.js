var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

exports.EosControl = {
  nodetype: "EosControl",
  descr: "Issues general control messages to Eos",
  path: __filename,
  inputs: {
    go: {type: Type.ANY, defaultValue: 0},
    cue: {type: Type.MUX, defaultValue: 0},
    grandmaster: {type: Type.FLOAT, defaultValue: 1},
    macro: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    eosMessageBuf: {type: Type.STRING, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.grandmaster = 100;
  },
  procfn: function (ports, state, id, triggerPort) {
    switch (triggerPort.name) {
      case "go":
        ports.eosMessageBuf.set("Go 1 #");
        break;
      case "cue":
        var q = ports.cue.get();
        if (q && (typeof q === "string" || typeof q === "number")) {
          // ports.eosMessageBuf.set("Cue 1 " + q + " #");
          ports.eosMessageBuf.set(`$ Go_To_Cue ${q} Time #`);
        }
        else if (q && typeof q === "object") {
          ports.eosMessageBuf.set(`$ Go_To_Cue ${q.cue} Time ${q.time} #`);
        }
        break;
      case "grandmaster":
        state.grandmaster = ~~(MathUtil.clip(ports.grandmaster.get() * 100, 0, 100));
        ports.eosMessageBuf.set(`Grandmaster 1 ${state.grandmaster} #`);
        break;
//      case "blackout":
//        ports.eosMess
//        break;
      case "macro":
        ports.eosMessageBuf.set(`Macro ${ports.macro.get()} #`);
        break;
      default:
        break;
    }
  }
};

exports.EosCue = {
  nodetype: "EosCue",
  descr: "Creates a cue for sending through EosControl",
  path: __filename,
  inputs: {
    goTo: {type: Type.ANY, defaultValue: 0},
    cueNumber: {type: Type.INT, defaultValue: 0},
    time: {type: Type.FLOAT, defaultValue: -1}
  },
  outputs: {
    cueMux: {type: Type.MUX, defaultValue: {cue: 0, time: 0}}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.goTo) {
      ports.cueMux.set({cue: ports.cueNumber.get(), time: ports.time.get()});
    }
  }
};
    
exports.EosSubLevel = {
  nodetype: "EosSubLevel",
  descr: "Sets the level for numerically indexed subs.",
  path: __filename,
  inputs: {
    1: {type: Type.FLOAT, defaultValue: 0},
    2: {type: Type.FLOAT, defaultValue: 0},
    3: {type: Type.FLOAT, defaultValue: 0},
    4: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    eosMessageBuf: {type: Type.String, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    ports.eosMessageBuf.set(`SubMove ${triggerPort.name} ${~~(MathUtil.clip(triggerPort.get() * 100, 0, 100))} #`);
  },
  variadicInput: true
};

exports.EosSubBump = {
  nodetype: "EosSubBump",
  descr: "Instantaneously bumps numerically indexed subs.",
  path: __filename,
  inputs: {
    1: {type: Type.BOOL, defaultValue: false},
    2: {type: Type.BOOL, defaultValue: false},
    3: {type: Type.BOOL, defaultValue: false},
    4: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    eosMessageBuf: {type: Type.String, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort.get() > 0.5) {
      ports.eosMessageBuf.set(`SubDown ${triggerPort.name} #SubUp ${triggerPort.name} #`);
    }
    // triggerPort.set(false); // Infinite loop
  },
  variadicInput: true
};

exports.EosChannelLevel = {
  nodetype: "EosChannelLevel",
  descr: "Sets the level for numerically indexed channel.",
  path: __filename,
  inputs: {
    "1": {type: Type.FLOAT, defaultValue: 0},
    "2": {type: Type.FLOAT, defaultValue: 0},
    "3": {type: Type.FLOAT, defaultValue: 0},
    "4": {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    eosMessageBuf: {type: Type.String, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    ports.eosMessageBuf.set(`$ Chan ${triggerPort.name} At ${~~(MathUtil.clip(triggerPort.get() * 100, 0, 100))} #`);
  },
  variadicInput: true
};
