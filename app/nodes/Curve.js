var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

const CurvePresets = {
  "linear": {
    points: [[0, 0], [1, 1]],
    smooth: false
  },
  "invert": {
    points: [[0, 1], [1, 0]],
    smooth: false
  },
  "ping-pong": {
    points: [[0, 0], [0.5, 1], [1, 0]],
    smooth: false
  },
  "ease-in": {
    points: [[-1, 0], [0, 0], [0.5, 0.33], [1, 1], [1.1, 10]],
    smooth: true
  },
  "ease-out": {
    points: [[-0.1, -10], [0, 0], [0.5, 0.66], [1, 1], [2, 1]],
    smooth: true
  },
  "ease-in-out": {
    points: [[-1, 0], [0, 0], [0.33, 0.25], [0.66, 0.75], [1, 1], [2, 1]],
    smooth: true
  },
  "wobble": {
    points: [[0.1, -10], [0, 0], [0.33, 0.66], [0.66, 0.33], [1, 1], [1.1, 10]],
    smooth: true
  }
};

exports.Curve = {
  nodetype: "Curve",
  descr: "Transforms a value by a given profile curve",
  path: __filename,
  inputs: {
    in: {type: Type.FLOAT, defaultValue: 0, continuous: false},
    points: {type: Type.ARRAY, defaultValue: CurvePresets.linear.points},
    smooth: {type: Type.BOOL, defaultValue: false},
    preset: {type: Type.STRING, defaultValue: "linear", enum: Object.keys(CurvePresets)},
    inMin: {type: Type.FLOAT, defaultValue: 0},
    inMax: {type: Type.FLOAT, defaultValue: 1},
    outMin: {type: Type.FLOAT, defaultValue: 0},
    outMax: {type: Type.FLOAT, defaultValue: 1}
  },
  outputs : {
    out: {type: Type.FLOAT, defaultValue : 0}
  },
  uiDefn: "hp/client/PanelCurveNode",
  emitter: true,
  initFn: function (ports, state) {
    state.points = [[-1, -1], [0, 0], [1, 1], [2, 2]];
  },
  procfn: function(ports, state, id, triggerPort, emitter) {
    var points = state.points;
    if (triggerPort === ports.in) {
      var inVal = MathUtil.normalize(ports.in.get(), ports.inMin.get(), ports.inMax.get());
      var outVal;
      // Find above and below points
      
      
      if (emitter) {
        emitter.emit('graph-update', 'graph-update', {
          "action": "graph-update",
          "id": id,
          "data": {output: outVal, input: inVal}
        });
      }
      ports.out.set(MathUtil.lerp(outVal, ports.outMin.get(), ports.outMax.get()));
    }
    else if (triggerPort === ports.preset) {
      var selection = triggerPort.get();
      if (CurvePresets.hasOwnProperty(selection)) {
        ports.points.set(CurvePresets[selection].points);
        ports.smooth.set(CurvePresets[selection].smooth);
        triggerPort.value = selection; // Updating the other ports changes this, so we sneak it back.
      }
    }
    else if (triggerPort === ports.smooth) {
      ports.preset.set("custom");
      if (emitter) {
        emitter.emit('graph-update', 'graph-update', {
          "action": "graph-update",
          "id": id,
          "data": {smooth: ports.smooth.get()}
        });
      }
    }
    else if (triggerPort === ports.points) {
      points = state.points = ports.points.get();
      if (points.length > 1) {
        if (points[0][0] >= 0) {
          points.unshift([points[0][0] - points[1][0] - points[0][0], points[0][1] - points[1][1] - points[0][1]]);
        }
        var l = points.length - 1;
        if (points[l][0] <= 1) {
          state.points.push([points[l][0] + points[l][0] - points[l - 1][0], points[l][1] + points[l][1] - points[l - 1][1]]);
        }
      }
      else {
        points.unshift([-1, -1]);
        points.push([2, 2]);
      }
      ports.preset.set("custom");
      if (emitter) {
        emitter.emit('graph-update', 'graph-update', {
          "action": "graph-update",
          "id": id,
          "data": {points: state.points}
        });
      }
    }
    
    var belowIdx = 1;
    // More optimally, we could start in the middle of the point list and work our way out.
    while (inVal > points[belowIdx][0] && belowIdx < points.length - 1) {
      belowIdx++;
    }
    if (belowIdx > 1) {
      belowIdx--;
    }
    var below = points[belowIdx];
    var above = points[belowIdx + 1];
    if (ports.smooth.get()) {
      // TODO: Fix smoothing... the tangents shouldn't always be horizontal.
      outVal = MathUtil.cubicInterp((inVal - below[0]) / (above[0] - below[0]), points[belowIdx - 1][1], below[1], above[1], points[belowIdx + 1][1]);
    }
    else {
      outVal = MathUtil.scale(inVal, below[0], above[0], below[1], above[1]);
    }
    
    return state;
  }
};