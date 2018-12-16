var Type = require("hp/model/ports").Type;

var sendEmit = function (value, dst, emt) {
  emt.emit('graph-update', 'graph-update', {
    "action": "graph-update",
    "id": dst,
    "data": value
  });
};

// Graph Conections
exports.SpatialPlot = {
  nodetype: "SpatialPlot",
  descr: "This will plot two dimensions of input",
  path: __filename,
  procfn: function (ports, state, id) {
    if (this.emitter) {
      sendEmit({
        x: ports.x.get(),
        y: ports.y.get()
      }, id, this.emitter);
    }
    return state;
  },
  inputs: {
    x: {
      type: Type.FLOAT,
      defaultValue: null,
      continuous: false
    },
    y: {
      type: Type.FLOAT,
      defaultValue: null,
      continuous: false
    },
  },
  outputs: {},
  uiDefn: "hp/client/PanelSpatialPlotNode",
  emitter: true
};
