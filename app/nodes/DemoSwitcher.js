var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
exports.DemoSwitcher = {
  nodetype: "DemoSwitcher",
  descr: "Switches between different filenames.",
  path: __filename,
  deprecated: true,
  inputs: {
    vlnscale: {type: Type.BOOL, defaultValue:true},
    bassrandom: {type: Type.BOOL, defaultValue:false},      
    ensemble: {type: Type.BOOL, defaultValue:false},
    trio: {type: Type.BOOL, defaultValue:false},
    off:  {type: Type.BOOL, defaultValue:false}
  },
  outputs: {
    output: {type: Type.STRING, defaultValue: ""},
    transport: {type:Type.STRING, defaultValue:0},
    select: {type:Type.STRING, defaultValue:0}
  },
  procfn: function (ports, state, id, triggerPort) {

     var lookupTable = {
      vlnscale : {
        g1: "vln2", g2: "off", g3: "off", g4: "off", 
        filename: "C:\\Users\\simon\\hyper-production-atom\\Logs\\fd_rec_05_final.log"
      },
      bassrandom : {
        g1: "bass", g2: "off", g3: "off", g4: "off", 
        filename: "C:\\Users\\simon\\hyper-production-atom\\Logs\\32.log"
      },
      ensemble : {
             g1: "cello", g2: "bass", g3: "keys", g4: "perc", 
        filename: "C:\\Users\\simon\\hyper-production-atom\\Logs\\234.log"   
      }
     }

    if (!triggerPort.get()) {
      return;
    }

    for (var p in ports) {
      if (p !== triggerPort.name && p !== "output" && p !== "select") {
        console.log("Setting false", p);
        ports[p].set(false);
      }
    }

    ports.transport.set(false);

    if (triggerPort.name !== 'off') {
      ports.output.set(lookupTable[triggerPort.name]);
      ports.transport.set(true);
    }

  }
};