var bb = require("./benb_utils.js");
var PortDirection = require("./ports.js").Direction;
var Type = require("./ports.js").Type;

var Connection = function(outputPort,inputPort,id) {

	//Be sure we are connecting an input to an output
	if (outputPort.direction != PortDirection.OUTPUT){
		l.error("ConnectByPortId outputId is not an output port.");
	  return null;
	}

	if (inputPort.direction != PortDirection.INPUT){
	  l.error("ConnectByPortId inputId is not an input port.");
    return null;
	}

  this.id = (id == null) ? bb.uuid() : id;
  this.outputPort = outputPort;
  this.inputPort = inputPort;

  outputPort.addConnection(this);
  inputPort.addConnection(this);
  
  var value = this.outputPort.get();
  // console.log(this.inputPort.type + " <- " + this.outputPort.type);
  if (this.inputPort.type !== Type.BUF && this.inputPort.type !== Type.OBJECT &&
      this.outputPort.type !== Type.BUF && this.outputPort.type !== Type.OBJECT &&
      value !== null && value !== undefined) {
    try {
      this.update(value);
    }
    catch (ex) {
      console.warn("Error setting port on connection: ", ex);
    }
  }
};

Connection.prototype.update = function(val) {
  this.inputPort.set(val);
};

Connection.prototype.destroy = function() {
  // console.log("Connection destroyed:");
  // console.log(this.id);
  this.outputPort.removeConnection(this);
  this.inputPort.removeConnection(this);
}

Connection.prototype.getElements = function() {
  //Returns the elements that the connection connects
  return {
    source: this.outputPort.getParent(),
    target: this.inputPort.getParent()
  };
}

Connection.prototype.getPortIDs = function () {
    return {
    source: this.outputPort.id,
    target: this.inputPort.id
  };
}

module.exports = Connection;
