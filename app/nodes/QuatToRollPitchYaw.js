var Type = require("hp/model/ports").Type;
var calcRollPitchYaw = function(quat, scale) {
    scale = scale || 1;
    var roll = Math.atan2(2.0 * (quat.w * quat.x + quat.y * quat.z),
        1.0 - 2.0 * (quat.x * quat.x + quat.y * quat.y));
    var pitch = Math.asin(Math.max(-1.0, Math.min(1.0, 2.0 * (quat.w * quat.y - quat.z * quat.x))));
    var yaw = Math.atan2(2.0 * (quat.w * quat.z + quat.x * quat.y),
        1.0 - 2.0 * (quat.y * quat.y + quat.z * quat.z));
    roll = (roll + Math.PI) / (Math.PI * 2) * scale;
    pitch = (pitch + (Math.PI / 2)) / Math.PI * scale;
    yaw = (yaw + Math.PI) / (Math.PI * 2) * scale;
    return [roll, pitch, yaw];
}


exports.QuatToRollPitchYaw = {
  nodetype: "QuatToRollPitchYaw",
  descr: " ",
  path: __filename,
  initFn: function() {},
  procfn : function(ports, state) {
    var xyzw = ports.xyzw.get();
    if (xyzw && Array.isArray(xyzw) && xyzw.length > 3) {
        if (xyzw.hasOwnProperty("args")) {
          xyzw = xyzw.args;
        }
        var quat = {x: xyzw[0].value, y: xyzw[1].value, z: xyzw[2].value, w: xyzw[3].value};
        var rpy = calcRollPitchYaw(quat, 1.0);
        ports.roll.set(((rpy[0]) - .5) * 2);
        ports.pitch.set(rpy[1]);
        ports.yaw.set(((rpy[2]) - .5) * 2);
    }
  },
  inputs: {
      xyzw : { type : Type.OBJECT, defaultValue: null },
  },
  outputs : {
    // -1 to 1
    roll : { type : Type.FLOAT, defaultValue : 0 },
    // 0 to 1
    pitch : { type : Type.FLOAT, defaultValue : 0 },
    // -1 to 1
    yaw : { type : Type.FLOAT, defaultValue : 0 },
  },
};
