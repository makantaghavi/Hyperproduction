var Type = require("hp/model/ports").Type;
// var RunningState = require("hp/model/MapNode").RunningState;
// var winston = require('winston');
var osc = require('osc-min');
var udp = require('dgram');

var LISTEN_PORT_NEXT = 9000;

exports.UDPTransceiver = {
  nodetype: "UDPTransceiver",
  descr: "Receives and sends UDP datagrams",
  path: __filename,
  inputs: {
    bufIn: { type : Type.BUF, defaultValue : 0, continuous: true},
    oscIn: { type: Type.OBJECT, defaultValue: {}, continuous: true},
    multiSend: { type : Type.MUX, defaultValue : 0 },
    sendHost: { type : Type.STRING, defaultValue : "127.0.0.1" },
    sendPort: { type : Type.INT, defaultValue: 4663 },
    listenPort: { type : Type.INT, defaultValue: LISTEN_PORT_NEXT }
  },
  outputs: {
    bufOut: { type : Type.BUF, defaultValue : 0 },
    oscOut: {type : Type.OBJECT, defaultValue: null},
    pktTime: { type: Type.FLOAT, defaultValue: 0 }
  },
  initFn: function(ports,state,name,emt) {
    var that = this;
    state.pktCount = 0;
    state.addrStringLookup = {};
    state.lastPktTime = null;
    state.sock = udp.createSocket("udp4", function(msg,rinfo) {
      that.parseMsg(ports,msg);
      state.pktCount++;
      var now = Date.now();
      if (state.lastPktTime === null) {
            state.lastPktTime = now;
            return;
      }
      ports.pktTime.set((now - state.lastPktTime)/1000);
      state.lastPktTime = now;
    });

    if (ports.listenPort.get() === ports.listenPort.defaultValue) {
      ports.listenPort.defaultValue = LISTEN_PORT_NEXT++;
      // ports.listenPort.reset(); // This is causing procfn to rebind. Let's just set it manually.
      ports.listenPort.value = ports.listenPort.defaultValue;
    }
    state.sock.bind(ports.listenPort.get());
  },
  parseMsg: function(ports,msg) {
    ports.bufOut.set(msg);
    let oscMessage = osc.fromBuffer(msg);
    if (oscMessage.type === "bundle") {
      for (let i = 0; i < oscMessage.elements.length; i++) {
        ports.oscOut.set(oscMessage.elements[i]);
      }
    }
    else {
      ports.oscOut.set(oscMessage);
    }
    // ports.oscOut.set(osc.fromBuffer(msg));
  },
  procfn: function(ports, state, id, triggerPort) {
    var that = this;
    switch (triggerPort.name) {
      case "bufIn":
        var buf = ports.bufIn.get();
        state.sock.send(buf, 0, buf.length, ports.sendPort.get(), ports.sendHost.get());
        break;
      case "oscIn":
        var buf = osc.toBuffer(ports.oscIn.get());
        state.sock.send(buf, 0, buf.length, ports.sendPort.get(), ports.sendHost.get());
        break;
      case "multiSend":
        var msgWithAddress = ports.multiSend.get();
        var addr = Object.keys(msgWithAddress)[0];
        if (!state.addrStringLookup.hasOwnProperty(addr)) {
          var translated = addr.replace(/_/g,'.').replace(/a/,'');
          state.addrStringLookup[addr]=translated.split("p");
        }
        var buf = msgWithAddress[addr];
        //console.log("MULTISEND", msgWithAddress, state.addrStringLookup);
        state.sock.send(buf, 0, buf.length,state.addrStringLookup[addr][1],state.addrStringLookup[addr][0]);
        break;
      case "listenPort":
        state.sock.close();
        state.sock = udp.createSocket("udp4", function(msg,rinfo) {
          that.parseMsg(ports,msg);
          state.pktCount++;
          var now = Date.now();
          if (state.lastPktTime === null) {
                state.lastPktTime = now;
                return;
          }
          ports.pktTime.set((now - state.lastPktTime)/1000);
          state.lastPktTime = now;
        });
        state.sock.bind(ports.listenPort.get());
        break;
      case "sendHost":
        /* falls through */
      case "sendPort":
        /* falls through */
      default:
        break;

    }
  },
  destroy: function(ports, state) {
    state.sock.close();
  }
};

exports.OSCMessage = {
  nodetype: "OSCMessage",
  descr: "Receives and sends UDP datagrams",
  path: __filename,
  inputs : {
    bufIn : { type: Type.BUF, defaultValue: null}
  },
  outputs : {
    bufOut : { type: Type.BUF, defaultValue: 0},
    oscOut: {type: Type.OBJECT, defaultValue: 0}
  },
  procfn: function(ports, state, id, triggerPort) {
    //called on new input
    var msg;
    if (triggerPort.name === "bufIn") {
      msg = osc.fromBuffer(ports.bufIn.get());
      if (msg) {
        var translated = msg.address.replace(/\//g,'_');
        if (ports.hasOwnProperty(translated)) {
          ports[translated].set(msg.args);
        }
      }
    } else {
      var ip = triggerPort.get();
      var values;
      // Is the intention here to be able to send an array (or object) of arguments? If so, and this works, we don't need OSCArrayMessage.
      if (ip != null && typeof ip == 'object') {
        values = [];
        for (var k in ip) {
          values.push(ip[k]);
        }
      }
      msg = {
        address: "" + triggerPort.name.replace(/_/g, '/'),
        args: (values) ? values : ip
      };
      ports.bufOut.set(osc.toBuffer(msg));
      ports.oscOut.set(msg);
    }
  }
};

exports.OSCArrayMessage = {
  nodetype: "OSCArrayMessage",
  descr: "Produces messages with multiple arguments.",
  path: __filename,
  inputs: {
    
  },
  outputs: {
    oscOut: {type: Type.OBJECT, defaultValue: 0},
    bufOut: {type: Type.BUF, defaultValue: 0}
  },
  procfn: function(ports, state, id, triggerPort) {
    //called on new input
    var msg;
    var ip = triggerPort.get();
    msg = {
      address: "" + triggerPort.name.replace(/_/g, '/'),
      args: Array.isArray(ip) ? ip : []
    };
    ports.bufOut.set(osc.toBuffer(msg));
    ports.oscOut.set(msg);
  },
  variadicInput: true
};

exports.ArgSplitter = {
  nodetype: "ArgSplitter",
  descr: "Receives and sends UDP datagrams",
  path: __filename,
  inputs : {
    argIn : { type: Type.ANY, defaultValue: 0}
  },
  outputs : {
    0: { type: Type.ANY, defaultValue: 0}
  },
  procfn: function ( ports, state, id, triggerPort) {
    var input = ports.argIn.get();
    for (var i = 0; i < input.length ; i++) {
      if (ports.hasOwnProperty(i)) {
        ports[i].set(input[i].value);
      }
    }
  },
  variadicOutput: true
};

exports.OSCFilter = {
  nodetype: "OSCFilter",
  path: __filename,
  inputs: {
    bufIn: {type: Type.BUF, defaultValue: null, fixed: true},
    oscIn: {type: Type.OBJECT, defaultValue: 0.0, fixed: true},
  },
  outputs: {
    bufOut: {type: Type.BUF, defaultValue: 0.0, fixed: true}
  },
  procfn:function (ports, state, id, triggerPort) {
    var msg;
    if (triggerPort.name === "bufIn") {
      msg = osc.fromBuffer(ports.bufIn.get());
    }
    else {
      msg = ports.oscIn.get();
    }
    if (msg) {
      // prefix += "/";
      var translated = msg.address.replace(/\//g,'_');
      //console.log("TRANSLATED", translated.startsWith);
      for (var prefix in ports) {

        // if (translated.indexOf(prefix)==0) {
        if (translated.startsWith(prefix)) {
          // ports[prefix].set((msg.args.length === 1) ? msg.args[0].value : msg.args);
          ports[prefix].set({address: msg.address.substr(prefix.length), args: msg.args });
          break;
        }
      }
    }
  },
  variadicOutput: true
};

exports.OSCPrepend = {
  nodetype: "OSCPrepend",
  path: __filename,
  inputs: {
    send: {type: Type.OBJECT, defaultValue: 0}
  },
  outputs: {
    oscOut: {type: Type.OBJECT, defaultValue: null},
    bufOut: {type: Type.BUF, defaultValue: 0} 
  },
  procfn: function (ports, state, id, triggerPort) {
    var msg = triggerPort.get();
    if (msg && msg.address) {
      msg.address = "/" + triggerPort.name.replace('_', '/') + msg.address;
      ports.oscOut.set(msg);
      ports.bufOut.set(osc.toBuffer(msg));
    }
  }
};

module.exports.FilterArgSplitter = {
  nodetype: "FilterArgSplitter",
  path: __filename,
  inputs: {
    argIn: {
      type: Type.OBJECT,
      defaultValue: 0.0,
      fixed: true
    },
  },
  outputs: {
    0: {
      type: Type.FLOAT,
      defaultValue: 0.0
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    var input = ports.argIn.get().args;
    for (var i = 0; i < input.length; i++) {
      if (ports.hasOwnProperty(i)) {
        ports[i].set(input[i].value);
      }
    }
  },
  variadicOutput: true
};

module.exports.BufToString = {
	nodetype: "BufToString",
	path: __filename,
	inputs: {
		buf: {type: Type.BUF, defaultValue: 0, fixed: true}
	},
	outputs: {
		string: {type: Type.STRING, defaultValue: ""}
	},
	procfn: function (ports, state, id, triggerPort) {
		ports.string.set(ports.buf.get().toString());
	}
};
