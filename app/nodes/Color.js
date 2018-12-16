var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
var ColorUtil = require("hp/lib/ptlib/util/ColorUtil");

exports.PackRGBi = {
  nodetype: "PackRGBi",
  descr: "Combine RGB [0..255] values into a single value.",
  path: __filename,
  inputs: {
    red: {type: Type.INT, defaultValue: 0},
    green: {type: Type.INT, defaultValue: 0},
    blue: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    rgb: {type: Type.HEX, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort, emitter) {
    var rgbi = ((ports.red.get() & 0xFF) << 16) | ((ports.green.get() & 0xFF) << 8) | (ports.blue.get() & 0xFF);
    ports.rgb.set(rgbi);
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "data" : {rgb: rgbi}
      });
    }
  },
  uiDefn: "hp/client/PanelColorNode",
  emitter : true
};

exports.UnpackRGBi = {
  nodetype: "UnpackRGBi",
  descr: "Combine RGB [0..255] values into a single value.",
  path: __filename,
  inputs: {
    rgb: {type: Type.HEX, defaultValue: 0}
  },
  outputs: {
    red: {type: Type.INT, defaultValue: 0},
    green: {type: Type.INT, defaultValue: 0},
    blue: {type: Type.INT, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    var rgb = ports.rgb.get();
    ports.red.set((rgb & 0xFF0000) >>> 16);
    ports.green.set((rgb & 0x00FF00) >>> 8);
    ports.blue.set((rgb & 0x0000FF));
  }
};

exports.PackRGBf = {
  nodetype: "PackRGBf",
  descr: "Combine RGB [0.0..1.0] values into a single value.",
  path: __filename,
  inputs: {
    red: {type: Type.FLOAT, defaultValue: 0},
    green: {type: Type.FLOAT, defaultValue: 0},
    blue: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    rgb: {type: Type.HEX, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort, emitter) {
    var rgbi = (((0xFF * ports.red.get()) & 0xFF) << 16) | (((0xFF * ports.green.get()) & 0xFF) << 8) | ((0xFF * ports.blue.get()) & 0xFF);
    ports.rgb.set(rgbi);
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "data" : {rgb: rgbi}
      });
    }
  },
  uiDefn: "hp/client/PanelColorNode",
  emitter : true
};

exports.PackHSV = {
  nodetype: "PackHSVf",
  descr: "Combine HSV [0.0..1.0] values into a single value.",
  path: __filename,
  inputs: {
    hue: {type: Type.FLOAT, defaultValue: 0},
    saturation: {type: Type.ZEROTOONE, defaultValue: 0},
    value: {type: Type.ZEROTOONE, defaultValue: 0}
  },
  outputs: {
    rgb: {type: Type.HEX, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort, emitter) {
    var hue = ports.hue.get();
    if (triggerPort.name === "hue") {
      while (hue > 1) {
        hue -= 1;
      }
      while (hue < 0) {
        hue += 1;
      }
      ports.hue.set(hue);
    }
    if (triggerPort.name === "hue") {
      while (hue > 1) {
        hue -= 1;
      }
      while (hue < 0) {
        hue += 1;
      }
      ports.hue.set(hue);
    }
    var hsv = [ports.hue.get(), ports.saturation.get(), ports.value.get()];
    if (emitter) {
      emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id" : id,
        "data" : {hsv: hsv}
      });
    }
    var rgb = ColorUtil.fromHSVa(hsv);
	ports.rgb.set(ColorUtil.toRGBInt(rgb));
   // ports.rgb.set((((0xFF * rgb[0]) & 0xFF) << 16) | (((0xFF * rgb[1]) & 0xFF) << 8) | ((0xFF * rgb[2]) & 0xFF));
  },
  uiDefn: "hp/client/PanelColorNode",
  emitter : true
};

exports.UnpackHSV = {
  nodetype: "UnpackHSVf",
  descr: "Extract HSV [0.0..1.0] values from a color integer.",
  path: __filename,
  inputs: {
    rgb: {type: Type.HEX, defaultValue: 0}
  },
  outputs: {
    hue: {type: Type.FLOAT, defaultValue: 0},
    saturation: {type: Type.FLOAT, defaultValue: 0},
    value: {type: Type.FLOAT, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    var rgb = ports.rgb.get();
    var hsv = ColorUtil.toHSV(ColorUtil.fromRGBInt(rgb));
    ports.hue.set(hsv[0]);
    ports.saturation.set(hsv[1]);
    ports.value.set(hsv[2]);
  }
};

exports.VaryColorHSV = {
  nodetype: "VaryColorHSV",
  descr: "Randomly changes parameters of a color.",
  path: __filename,
  inputs: {
    rgbIn: {type: Type.HEX, defaultValue: 0, fixed: true},
    vHue: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    vSaturation: {type: Type.FLOAT, defaultValue: 0, fixed: true},
    vValue: {type: Type.FLOAT, defaultValue: 0, fixed: true}
  },
  outputs: {
    rgb: {type: Type.HEX, defaultValue: 0}
  },
  procfn: function (ports, state, id, triggerPort) {
    var rgb = ports.rgbIn.get();
    var hsv = ColorUtil.toHSV(ColorUtil.fromRGBInt(rgb));
    hsv[0] += Math.random() * ports.vHue.get();
    hsv[1] += Math.random() * ports.vSaturation.get();
    hsv[2] += Math.random() * ports.vValue.get();
    ports.rgb.set(ColorUtil.toRGBInt(ColorUtil.fromHSVa(hsv)));
  }
};
