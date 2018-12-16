var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;

var MyoManager = {};
var Myo = require('myo');
MyoManager.connected = false;

var nextMyoId = 0;

var myoProcfn = function(ports, state, id, triggerPort) {
  switch (triggerPort.name) {
    case "zeroOrientation":
      if (triggerPort.get()) {
        state.myo.zeroOrientation();
        // ports.zeroOrientation.value = false;
      }
      break;
    case "vibrate":
      var vibDur = Number.parseInt(triggerPort.get(), 10);
      if (vibDur === 1) {
        state.myo.vibrate("short");
      }
      else if (vibDur === 2) {
        state.myo.vibrate("medium");
      }
      else if (vibDur === 3) {
        state.myo.vibrate("long");
      }
      break;
    case "streamEMG":
      state.myo.streamEMG(triggerPort.get());
      break;
    default:
      break;
  }
  return state;
};

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
};

var myoInit = function(ports, state) {
    state.myo = Myo.create(nextMyoId, {});
    state.myoId = nextMyoId;
    nextMyoId++;
    state.MyoManager = MyoManager;
    console.log("Listening for Myo connection...");
    // only add callback once
    state.myo.on('connected', function() {
        state.myo.vibrate('short');
        console.log("Myo " + String(this.id) + " connected.");
        state.myo.streamEMG(false);
        state.myo.setLockingPolicy('none');
    });
    state.myo.on('imu', function(data) {
        ports.accX.set(data.accelerometer.x);
        ports.accY.set(data.accelerometer.y);
        ports.accZ.set(data.accelerometer.z);
        ports.gyrX.set(data.orientation.x);
        ports.gyrY.set(data.orientation.y);
        ports.gyrZ.set(data.orientation.z);
        data.id = state.myo.id;
        data.name = ports.name.value;
        ports.accObj.set(data);
        var rpy = calcRollPitchYaw(data.orientation, 1.0);
        // roll and yaw in [-1, 1]
        rpy[0] = ((rpy[0]) - 0.5) * 2;
        rpy[2] = ((rpy[2]) - 0.5) * 2;
        ports.roll.set(rpy[0]);
        ports.pitch.set(rpy[1]);
        ports.yaw.set(rpy[2]);
        rpy.name = ports.name.value;
        ports.rollPitchYaw.set(rpy);
    });
    state.myo.on('emg', function(data) {
        ports.emg0.set(data[0]);
        ports.emg1.set(data[1]);
        ports.emg2.set(data[2]);
        ports.emg3.set(data[3]);
        ports.emg4.set(data[4]);
        ports.emg5.set(data[5]);
        ports.emg6.set(data[6]);
        ports.emg7.set(data[7]);
        ports.emgObj.set({id: state.myo.id, data: data, name: ports.name.value});
    });
    state.myo.onError = function(){
        console.log("Woah, couldn't connect to Myo Connect");
    };
};

exports.Myo = {
  nodetype: "Myo",
  generator: true,
  descr: "Outputs Myo data stream",
  path: __filename,
  initFn: myoInit,
  procfn: myoProcfn,
  destroy: function(){},
  inputs: {
    name: {type: Type.STRING, defaultValue: ""},
    zeroOrientation: {type: Type.BOOL, defaultValue: false},
    vibrate: {type: Type.INT, defaulValue: 0},
    streamEMG: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    accX: {type: Type.FLOAT, defaultValue: 0 },
    accY: {type: Type.FLOAT, defaultValue: 0 },
    accZ: {type: Type.FLOAT, defaultValue: 0 },
    gyrX: {type: Type.FLOAT, defaultValue: 0 },
    gyrY: {type: Type.FLOAT, defaultValue: 0 },
    gyrZ: {type: Type.FLOAT, defaultValue: 0 },
    roll: {type: Type.FLOAT, defaultValue: 0 },
    pitch: {type: Type.FLOAT, defaultValue: 0 },
    yaw: {type: Type.FLOAT, defaultValue: 0 },
    rollPitchYaw: {type: Type.OBJECT, defaultValue: [] },
    accObj: {type: Type.OBJECT, defaultValue: {}},
    emg0: {type: Type.FLOAT, defaultValue: 0 },
    emg1: {type: Type.FLOAT, defaultValue: 0 },
    emg2: {type: Type.FLOAT, defaultValue: 0 },
    emg3: {type: Type.FLOAT, defaultValue: 0 },
    emg4: {type: Type.FLOAT, defaultValue: 0 },
    emg5: {type: Type.FLOAT, defaultValue: 0 },
    emg6: {type: Type.FLOAT, defaultValue: 0 },
    emg7: {type: Type.FLOAT, defaultValue: 0 },
    emgObj: {type: Type.OBJECT, defaultValue: {data:[]}},
  },
};

exports.PitchYawBend = {
  nodetype: "PitchYawBend",
  generator: true,
  descr: "Measures bend between two Roll-Pitch vectors (ignores yaw if given)",
  procfn: function(ports, state, id, triggerPort) {
      if (triggerPort.name == "rollPitchYaw1") {
          var yawDist = Math.abs(ports.rollPitchYaw1.value[2] - ports.rollPitchYaw2.value[2]);
          if (yawDist > 0.8) {
              //  probably wrap-around
              yawDist = 2.0 - yawDist;
          }
          //  pitch ranges 0-1
          var pitchDist = Math.abs(ports.rollPitchYaw1.value[1] - ports.rollPitchYaw2.value[1]);
          ports.bend.set(yawDist + pitchDist);
      }
  },
  destroy: function(){},
  inputs: {
    rollPitchYaw1: {type: Type.ARRAY, defaultValue: [0, 0, 0]},
    rollPitchYaw2: {type: Type.ARRAY, defaultValue: [0, 0, 0]},
  },
  outputs: {
    bend: {type: Type.FLOAT, defaultValue: 0},

  },
};
