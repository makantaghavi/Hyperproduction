var Type = require("hp/model/ports").Type;
var bb = require("hp/model/benb_utils");
var events = require("events");
var RunningState = require("hp/model/MapNode").RunningState;

var INPUTS = bb.defineEnum(["wifi24","wifi58","uhf"]);

var emitter = null;

var switchedInputSourceUI = function (source,emt,name){
  //console.log("switching event");
  //console.log(emt);
  if (emt instanceof events.EventEmitter) {
    emt.emit('failover-ui-event', 'failover-ui-event', {
      "action": "switched-input-source",
      "source" : source,
      "name" : name
    });
  }
}

var selectInputBtn = function (source,emt,name){
  //console.log("switching event");
  //console.log(emt);
  if (emt instanceof events.EventEmitter) {
    emt.emit('failover-ui-event', 'failover-ui-event', {
      "action": "select-btn",
      "source" : source,
      "name" : name
    });
  }
}

var dataReceivedUI = function (source,emt,name){
  if (emt instanceof events.EventEmitter) {
    emt.emit('failover-ui-event', 'failover-ui-event', {
      "action": "data-received",
      "source" : source,
      "name" : name
    });
  }
}

var updatePacketCounts = function (counts,emt,name){
  //emt = emt || emitter;
  if (emt instanceof events.EventEmitter) {
    emt.emit('failover-ui-event', 'failover-ui-event', {
      "action": "packet-counts",
      "counts" : counts,
      "name" : name,
    });
  }
}

var graphDst = 0;

exports.Failover = {
  nodetype: "Failover",
  descr: "Takes several inputs, defaults to first input, and if there is no data after a specified timeout, switched to another source.",
  path: __filename,
  deprecated: true,
  initFn: function(ports,state,name,emt) {
    Object.observe(state,function(changes) {
      //console.log();
      changes.forEach(function(c) {
        if(c.name === "activeSource") {
          switchedInputSourceUI(c.object.activeSource, emt, name);
        }
      });
    });
    state.activeSource = INPUTS.WIFI24;
    state.manualOverride = false;
    selectInputBtn("auto", emt, name);
    state.runningState = RunningState.RUNNING;
    state.failTimer = setTimeout(failover, ports.timeoutMs.get(), ports, state, emt, name);
    state.packetCounter = setTimeout(packetCounter, 1000, ports, state, emt, name);
    state.packetCounts = { uhf: 0, wifi24: 0};
    state.name = name;
  },
  procfn: function(ports, state, id, triggerPort) {
    //dataReceivedUI(triggerPort.name, this.emitter);
    // if (this.emitter && !emitter) {
    //   emitter = this.emitter;
    // }
    state.packetCounts[triggerPort.name] += 1;
    //console.log(state.packetCounts);
    if (triggerPort.name === state.activeSource) {
      clearTimeout(state.failTimer);
      ports.out.set(ports[state.activeSource].get());
      if (state.runningState !== RunningState.STOPPED) {
        state.failTimer = setTimeout(failover, ports.timeoutMs.get(), ports, state, this.emitter, state.name);
      }
    }
  },
  inputs: {
    wifi24 : {type: Type.ANY, defaultValue : {}, continuous: true},
    uhf: {type: Type.ANY, defaultValue : {}, continuous: true},
    timeoutMs : {type: Type.INT, defaultValue : 100}
  },
  outputs : {
    out: {type: Type.ANY, defaultValue : {}}
  },
  emitter : true,
  uiDefn: "hp/client/PanelFailoverDisplay",
  receiveEvent: function (ports,state,refcon) {
    console.log("Got UI Event!", refcon);

    if (refcon.source === "auto") {
      state.manualOverride = false;
    } else {
      clearTimeout(state.failTimer);
      state.manualOverride = true;
      if (state.runningState !== RunningState.STOPPED) {
        state.failTimer = setTimeout(failover, ports.timeoutMs.get(), ports, state, this.emitter, state.name);
      }
      state.activeSource=refcon.source;

    }

    selectInputBtn(refcon.source, this.emitter, refcon.name);

  }
};

var packetCounter = function(ports,state,emt,name) {
  //console.log("ACTIVE", state.activeSource);
  updatePacketCounts(state.packetCounts, emt,name);
  //console.log(state.packetCounts);
  if (state.packetCounts[state.activeSource] <= 35) {
    failover(ports,state,emt);
  }
  state.packetCounts = { wifi24:0, uhf:0};
  if (state.runningState !== RunningState.STOPPED) {
    state.packetCounter = setTimeout(packetCounter, 1000, ports, state, emt,name);
  }
}

var failover = function(ports, state, emt) {
  if (state.manualOverride) {
    return;
    }
  //console.log(state);
  //console.log(INPUTS);
  clearTimeout(state.failTimer);
  switch (state.activeSource) {
    case INPUTS.WIFI24:
      state.activeSource = INPUTS.UHF;
      break;
    case INPUTS.UHF:
      state.activeSource = INPUTS.WIFI24;
      break;
    case INPUTS.WIFI58:
    default:
      state.activeSource = INPUTS.WIFI24;
      break;
  }
  // console.log("!!! FAILOVER EVENT !!! New src:", state.activeSource);
  //switchedInputSourceUI(state.activeSource, emt, state.name);
  if (state.runningState !== RunningState.STOPPED) {
    state.failTimer = setTimeout(failover, ports.timeoutMs.get(), ports, state, emt, state.name);
  }
};
