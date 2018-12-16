//Node definition
exports.OSCMessage = {
  nodetype: "OSCMessage",
  descr: "Receives and sends UDP datagrams",
  path: __filename,
  //Defining Inputs
  inputs : {
    bufIn : { type: Type.BUF, defaultValue: null}
  },
  //Defining Outputs
  outputs : {
    bufOut : { type: Type.BUF, defaultValue: 0},
    oscOut: {type: Type.OBJECT, defaultValue: 0}
  },
  //Processing Function
  procfn: function(ports, state, id, triggerPort) {
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












































exports.Multiply = {
  nodetype: "Multiply",
  descr : "Multiply Inputs",
  path: __filename,
  //Processing function
  procfn : function(ports) {
      var product = 1;
      for (var input in this.inputs) {
        product *= ports[input].get();
      }
      ports.product.set(product);
    },
  //Defining Inputs
  inputs : {
    i1: { type : Type.NUM, defaultValue : 0.0 },
    i2: { type : Type.NUM, defaultValue : 0.0 },
  },
  //Defining outputs
  outputs : {
    product: { type : Type.NUM, defaultValue : 0.0 },
  },
};








