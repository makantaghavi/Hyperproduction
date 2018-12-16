var l = require("./log.js");
var Type = require("./ports.js").Type;

exports.X32ReceiveNode = {
  nodetype: "X32ReceiveNode",
  descr : "Receives data from the X32 module",
  deviceType: "RCV",
  defaultHost: "x32console-east.media.mit.edu",
  defaultPort: "10023",
  subscribeMsg: "/xremote",
  subscribeIntvl: 8,
  outputs : {
    ch1: { type : Type.FLOAT, defaultValue : 0},
    ch2: { type : Type.FLOAT, defaultValue : 0},
    ch3: { type : Type.FLOAT, defaultValue : 0},
    dca6: { type : Type.FLOAT, defaultValue : 0},
    dca8: { type : Type.FLOAT, defaultValue : 0},

  },
  addresses : {
    "/ch/01/mix/fader": ["ch1"], //ordering of arguments over to each port from info from the address
    "/ch/02/mix/fader": ["ch2"],
    "/ch/03/mix/fader": ["ch3"],
    "/dca/6/fader": ["dca6"],
    "/dca/8/fader": ["dca8"],
  }
};

exports.X32SendNode = {
  nodetype: "X32SendNode",
  descr: "Sends data to the X32 module",
  deviceType: "SND",
  defaultHost: "x32console-east.media.mit.edu",
  defaultPort: "10023",
  inputs : {
    i1: { type : Type.INT, defaultValue : 0},
    i2: { type : Type.INT, defaultValue : 0},
  },
  addresses : {
      "/ch/04/mix/fader" : ["i1"],
      "/ch/05/mix/fader" : ["i2"]
    },
};

exports.TouchOSC = {
  nodetype: "TouchOSC",
  descr: "Receives data from a simple TouchOSC interface",
  deviceType: "RCV",
  defaultHost: "x32console-east.media.mit.edu",
  defaultPort: "10023",
  inputs: {},
  outputs: {
    o1: {type: Type.INT, defaultValue : 0}
  },
  addresses: {
    "/1/fader2" : ["o1"]
  }
};

exports.ATEMSend = {
  //To be completed
  nodetype:"ATEMSend",
  deviceType: "SND",
  descr:"Sends data to the ATEM",
  networkingmodel: "UpdateOnChange",
  inputs: {
    i1: {type: Type.INT, defaultValue: 50},
    i2: {type: Type.INT, defaultValue: 50}
  },
  addresses : {
    "/atem/program/5" : ["i1"],
    "/atem/program/6" : ["i2"]
  }
};

exports.GloverSerial = {
  nodetype:"GloverSerial",
  descr: "Receive data from Glover",
  deviceType: "RCV",
  outputs: {
    pitchL: {type: Type.INT, defaultValue: 0},
    rollL: {type: Type.INT, defaultValue: 0},
    yawL: {type: Type.INT, defaultValue: 0},
    peakXL: {type: Type.INT, defaultValue: 0},
    peakYL: {type: Type.INT, defaultValue: 0},
    peakZL: {type: Type.INT, defaultValue: 0},
    drumL: {type: Type.INT, defaultValue: 0},
    magL: {type: Type.INT, defaultValue: 0},
    dirL: {type: Type.INT, defaultValue: 0},

    pitchR: {type: Type.INT, defaultValue: 0},
    rollR: {type: Type.INT, defaultValue: 0},
    yawR: {type: Type.INT, defaultValue: 0},
    peakXR: {type: Type.INT, defaultValue: 0},
    peakYR: {type: Type.INT, defaultValue: 0},
    peakZR: {type: Type.INT, defaultValue: 0},
    drumR: {type: Type.INT, defaultValue: 0},
    magR: {type: Type.INT, defaultValue: 0},
    dirR: {type: Type.INT, defaultValue: 0}
  },
  addresses: {
    "/glover/gyroPeakXL" : ["peakXL"],
    "/glover/gyroPeakYL" : ["peakYL"],
    "/glover/gyroPeakZL" : ["peakZL"],
    "/glover/gyroPeakXR" : ["peakXR"],
    "/glover/gyroPeakYR" : ["peakYR"],
    "/glover/gyroPeakZR" : ["peakZR"],
    "/glover/drumL" : ["drumL"],
    "/glover/drumR" : ["drumR"],
    "/glover/orientationL" : ["pitchL", "rollL", "yawL"],
    "/glover/orientationR" : ["pitchR", "rollR", "yawR"],
    "/glover/magnitudeL": ["magL"],
    "/glover/magnitudeR": ["magR"],
    "/directionL" : ["dirL"],
    "/directionR" : ["dirR"]
  }
}

exports.OsculatorPlotter = {
  nodetype:"OsculatorPlotter",
  descr: "Send data to osclator",
  defaultHost: "127.0.0.1",
  defaultPort: 7110,
  deviceType: "SND",
  inputs: {
    i1: {type: Type.FLOAT, defaultValue: 0.0},
    i2: {type: Type.FLOAT, defaultValue: 0.0},
    i3: {type: Type.FLOAT, defaultValue: 0.0},
    i4: {type: Type.FLOAT, defaultValue: 0.0},
    i5: {type: Type.FLOAT, defaultValue: 0.0},
    i6: {type: Type.FLOAT, defaultValue: 0.0},
    i7: {type: Type.FLOAT, defaultValue: 0.0},
    i8: {type: Type.FLOAT, defaultValue: 0.0},
    i9: {type: Type.FLOAT, defaultValue: 0.0},
    i10: {type: Type.FLOAT, defaultValue: 0.0},
    i11: {type: Type.FLOAT, defaultValue: 0.0},
    i12: {type: Type.FLOAT, defaultValue: 0.0},
    i13: {type: Type.FLOAT, defaultValue: 0.0},
    i14: {type: Type.FLOAT, defaultValue: 0.0},
    i15: {type: Type.FLOAT, defaultValue: 0.0},
    i16: {type: Type.FLOAT, defaultValue: 0.0},

  }, 
  addresses: {
    data: ["i1", "i2","i3", "i4","i5", "i6","i7", "i8","i9", "i10","i11", "i12","i13", "i14", "i15", "i16"]
  }
}

exports.QuartzPowersDemo = {
  nodetype:"QuartzPowersDemo",
  descr: "Send data to quartz for swfa14 demo",
  defaultHost: "operastudio.media.mit.edu",
  defaultPort: 8000,
  deviceType: "SND",
  inputs: {
    spaceSize: {type: Type.FLOAT, defaultValue: 0.0},
    vortex: {type: Type.FLOAT, defaultValue: 0.0},
    saturation: {type: Type.FLOAT, defaultValue: 0.0},
    unsharpIntensity: {type: Type.FLOAT, defaultValue: 0.0},
    dofAmount: {type: Type.FLOAT, defaultValue: 0.0},
  }, 
  addresses: {
    "/spaceSize": ["spaceSize"],
    "/vortex": ["vortex"],
    "/saturation": ["saturation"],
    "/unsharpIntensity": ["unsharpIntensity"],
    "/dofAmount": ["dofAmount"],

  }
}

exports.GloverSenderLeft = {
  nodetype:"GloverSenderLeft",
  descr: "Receive OSC data and ",
  defaultHost: "10.99.10.15",
  defaultPort: 8111,
  deviceType: "SND",
  raw: true,
  inputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.GloverSenderRight = {
  nodetype:"GloverSenderRight",
  descr: "Receive OSC data and ",
  defaultHost: "10.99.10.15",
  defaultPort: 8222,
  deviceType: "SND",
  raw: true,
  inputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.AdamSenderLeft = {
  nodetype:"AdamSenderLeft",
  descr: "Receive OSC data and ",
  defaultHost: "10.99.10.13",
  defaultPort: 8111,
  deviceType: "SND",
  raw: true,
  inputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.AdamSenderRight = {
  nodetype:"AdamSenderRight",
  descr: "Receive OSC data and ",
  defaultHost: "10.99.10.13",
  defaultPort: 8222,
  deviceType: "SND",
  raw: true,
  inputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.Wifi24ReceiverLeft = {
  nodetype:"Wifi24ReceiverLeft",
  descr: "Receive OSC data and ",
  defaultHost:"localhost",
  defaultPort: 5700,
  deviceType: "RCV",
  raw: true,
  outputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.Rs485ReceiverLeft = {
  nodetype:"Rs485ReceiverLeft",
  descr: "Receive OSC data and ",
  defaultHost:"localhost",
  defaultPort: 5710,
  deviceType: "RCV",
  raw: true,
  outputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.Wifi24ReceiverRight = {
  nodetype:"Wifi24ReceiverRight",
  descr: "Receive OSC data and ",
  defaultHost:"localhost",
  defaultPort: 5800,
  deviceType: "RCV",
  raw: true,
  outputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}

exports.Rs485ReceiverRight = {
  nodetype:"Rs485ReceiverRight",
  descr: "Receive OSC data and ",
  defaultHost:"localhost",
  defaultPort: 5810,
  deviceType: "RCV",
  raw: true,
  outputs: {
    raw: {type: Type.FLOAT, defaultValue: 0.0},
  }
}



