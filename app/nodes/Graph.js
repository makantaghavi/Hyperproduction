var Type = require("hp/model/ports").Type;

// Graph Conections
exports.Graph = {
  nodetype: "Graph",
  descr: "This will graph this signal on Graph",
  path: __filename,
  procfn: function(ports, state, id, triggerPort, emitter) {
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "series": triggerPort.name,
        "data" : triggerPort.get()
      });
    }
    ports.out.set(ports.in.get());
    return state;
  },
  inputs: {
    in : {type: Type.FLOAT, defaultValue : 0, continuous: true},
//    scaledIn : {type: Type.INT, defaultValue : null, continuous: true}
  },
  outputs : {
    out: {type: Type.FLOAT, defaultValue : 0}
  },
  uiDefn: "hp/client/PanelSimpleGraphNode",
  emitter : true
};

exports.MultiGraph = {
  nodetype: "MultiGraph",
  descr: "This will graph this signal on Graph",
  path: __filename,
  procfn: function(ports, state, id, triggerPort, emitter) {
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "series": triggerPort.name,
        "data" : triggerPort.get()
      });
    }
//    ports.out.set(ports.in.get());
    return state;
  },
  inputs: {
    in : {type: Type.FLOAT, defaultValue: 0, continuous: true},
  },
  outputs : {
//    out: {type: Type.FLOAT, defaultValue: 0}
  },
  uiDefn: "hp/client/PanelSimpleGraphNode",
  variadicInput: true,
  emitter: true
};

exports.MuxGraph = {
  nodetype: "MuxGraph",
  descr: "This will graph a muxed ensemble of time series",
  path: __filename,
  procfn: function(ports, state, id, triggerPort, emitter) {
//    if (emitter) {
//      emitter.emit('graph-update', 'graph-update', {
//        "action": "graph-update",
//        "id" : id,
//        "data" : triggerPort.get()
//      });
//    }
//    return state;
  },
  tick: function (ports, state, id, tickData, defn) {
    if (defn.emitter) {
      defn.emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "data" : ports.in.get()
      });
    }
    // ports.out.set(ports.in.get());
  },
  inputs: {
    in : {type: Type.MUX, defaultValue: 0, continuous: true},
  },
  outputs : {
//    out: {type: Type.OBJECT, defaultValue: 0}
  },
  uiDefn: "hp/client/PanelMuxGraphNode",
  emitter : true
};

exports.TileGraph = {
  nodetype: "TileGraph",
  descr: "Graphs multiple muxed time series",
  path: __filename,
  initFn: function (ports, state, id) {
    state.data = {};
  },
  procfn: function (ports, state, id, triggerPort, emitter) {
//    if (emitter) {
//      emitter.emit('graph-update', 'graph-update', {
//        "action": "graph-update",
//        "id" : id,
//        "graph": triggerPort.name,
//        "data" : triggerPort.get()
//      });
//    }
//    return state;
    state.data[triggerPort.name] = {graph: triggerPort.name, data: triggerPort.get()};
  },
  tick: function (ports, state, id, tickData, defn) {
    if (defn.emitter) {
      defn.emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id": id,
        "data": state.data
      });
    }
    // ports.out.set(ports.in.get());
  },
  inputs: {
    in: {type: Type.MUX, defaultValue: 0, continuous: true},
  },
  outputs : {
//    out: {type: Type.OBJECT, defaultValue: 0}
  },
  uiDefn: "hp/client/PanelTileGraphNode",
  emitter: true,
  variadicInput: true
};

exports.BarGraph = {
  nodetype: "BarGraph",
  descr: "This will graph the current values of inputs",
  path: __filename,
  procfn: function(ports, state, id, triggerPort, emitter) {
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "series": triggerPort.name,
        "data" : triggerPort.get()
      });
    }
//    ports.out.set(ports.in.get());
    return state;
  },
  inputs: {
    i1 : {type: Type.NUM, defaultValue: 0, continuous: false},
  },
  outputs : {
//    out: {type: Type.FLOAT, defaultValue: 0}
  },
  uiDefn: "hp/client/PanelBarGraphNode",
  variadicInput: true,
  emitter: true
};

exports.Monitor = {
  nodetype: "Monitor",
  descr: "This will display an indicator for values of inputs",
  path: __filename,
  procfn: function(ports, state, id, triggerPort, emitter) {
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "series": triggerPort.name,
        "data" : triggerPort.get()
      });
    }
//    ports.out.set(ports.in.get());
    return state;
  },
  inputs: {
    i1 : {type: Type.FLOAT, defaultValue: 0, continuous: false},
  },
  outputs : {
//    out: {type: Type.FLOAT, defaultValue: 0}
  },
  uiDefn: "hp/client/PanelMonitorNode",
  variadicInput: true,
  emitter: true
};
