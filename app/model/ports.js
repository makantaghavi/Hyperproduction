var bb = require("./benb_utils.js");
var Direction = bb.defineEnum(["INPUT","OUTPUT"]);
var Type = bb.defineEnum(["ANY", "INT", "HEX", "EXT", "NUM", "ZEROTOONE", "FLOAT", "BOOL", "OBJECT", "BUF", "STRING", "ARRAY", "ENUM", "MUX", "COLOR"]);
var DefaultValue = Object.freeze({
	[Type.ANY]: 0,
	[Type.INT]: 0,
	[Type.HEX]: 0x00,
	[Type.EXT]: 0,
	[Type.NUM]: 0.0,
	[Type.ZEROTOONE]: 0.0,
	[Type.FLOAT]: 0.0,
	[Type.BOOL]: false,
	[Type.OBJECT]: {},
	[Type.BUF]: {},
	[Type.STRING]: "",
	[Type.ARRAY]: [],
	[Type.ENUM]: "",
	[Type.MUX]: {},
	[Type.COLOR]: "#000000"
});

/*
  TODO:
    - Make input ports check they have only a single source

*/

var NUMERIC_TYPES = [Type.NUM, Type.ZEROTOONE, Type.FLOAT, Type.INT];

exports.OutputPort = function(parent, params, id, name) {

  this.type = params.type;
  this.id = (id == null) ? bb.uuid() : id;
  this.value = params.defaultValue;
  this.continuous = params.continuous;
  this.defaultValue = (typeof params.defaultValue === 'undefined') ? DefaultValue[params.type] : params.defaultValue;
  this.previousValue = params.defaultValue;
  this.parent = parent;
  this.connections = {};
  this.direction = Direction.OUTPUT;
  this.name = name;
  this.editor = !!params.editor;
  this.fixed = !!params.fixed;
};

exports.OutputPort.prototype.set = function(newValue) {

  this.previousValue = this.value;
  this.value = newValue;

  bb.forEachObjKey(this.connections, function(connId,conn){
   
    conn.update(this.value);

  }.bind(this));

  if (this.continuous || this.value !== this.previousValue) {
   
    this.emit();
  }
};

exports.OutputPort.prototype.reset = function () {
  this.set(this.defaultValue);
};

exports.OutputPort.prototype.validateAndSet = function (newValue) {
  newValue = validatePortType(this.type, newValue);
  if (newValue !== undefined) {
    this.set(newValue);
  }
};

exports.OutputPort.prototype.emit = function() {
  if (this.sendUpdates) {
    this.parent.defn.emitter.emit('mapping-changed','mapping-changed',{
      "action" : "update-port-value",
      "id" : this.id,
      "container" : this.sendUpdates,
      "value" : (this.type === Type.HEX) ? this.value.toString(16) : this.value
    });
  }
};

exports.OutputPort.prototype.get = function() {
  // TODO: We should really be handling parsing of types here... or on set(); This seems to be more of an issue now than it was before.
  return this.value;
};

exports.OutputPort.prototype.getId = function() {
  return this.id;
};

exports.OutputPort.prototype.getName = function() {
  return this.name;
};

exports.OutputPort.prototype.getParent = function() {
  return this.parent;
};

exports.OutputPort.prototype.addConnection = function(conn) {
  this.connections[conn.id] = conn;
};

exports.OutputPort.prototype.removeConnection = function(conn) {
  delete this.connections[conn.id];
};

exports.OutputPort.prototype.portChanged = function() {
  return this.value != this.previousValue;
};

exports.InputPort = function(parent, params, id, name) {

  //console.log("IP", parent, params, id, name);
  //console.trace();
  this.continuous = params.continuous;
  this.type = params.type;
  this.isNumType = (NUMERIC_TYPES.indexOf(this.type) > -1);
  this.id = (id == null) ? bb.uuid() : id;
  this.value = params.defaultValue;
  this.defaultValue = (typeof params.defaultValue === 'undefined') ? DefaultValue[params.type] : params.defaultValue;
  this.previousValue = params.defaultValue;
  this.parent = parent;
  this.connections = {};
  this.direction = Direction.INPUT;
  this.name = name;
  this.editor = !!params.editor;
  this.fixed = !!params.fixed;
  this.published = (params.published) ? params.published : false;
   if (params.enum) {
    this.enum = params.enum;
  }
};

exports.InputPort.prototype.addConnection = function(conn) {
  this.connections[conn.id] = conn;
};

exports.InputPort.prototype.removeConnection = function(conn) {
  delete this.connections[conn.id];
};

exports.InputPort.prototype.get = function() {
  return this.value;
};

exports.InputPort.prototype.getName = function() {
  return this.name;
};

exports.InputPort.prototype.getId = function() {
  return this.id;
};

exports.InputPort.prototype.getParent = function() {
  return this.parent;
};

exports.InputPort.prototype.emit = function() {
  if (this.sendUpdates) {
    this.parent.defn.emitter.emit('mapping-changed','mapping-changed',{
      "action" : "update-port-value",
      "id" : this.id,
      "value" : this.value,
      "container" : this.sendUpdates,
    });
  }
};

exports.InputPort.prototype.set = function (newValue) {
  this.previousValue = this.value;
  this.value = newValue;
  
  if (this.value !== this.previousValue || this.continuous || this.parent.defn.continuous) {
    // l.log("debug","Setting input port "+this.id+" "+this.name+" "+this.type+" in node "+this.parent.defn.nodetype+" to "+this.value);
    this.parent.process(this);
    this.emit();
  }
};

exports.InputPort.prototype.reset = function () {
  this.set(this.defaultValue);
};

exports.InputPort.prototype.setPublished = function (newValue) {
  this.published = newValue;
//  if (newValue) {
//    console.log("restoring published for " + this.id);
//  }
};


exports.InputPort.prototype.validateAndSet = function (newValue) {
  newValue = validatePortType(this.type, newValue);
  if (newValue !== undefined) {
    this.set(newValue);
  }
};

exports.InputPort.prototype.getPreviousValue = function(){
  return this.previousValue;
};

exports.InputPort.prototype.portChanged = function() {
  return this.value != this.previousValue;
};

exports.OutputPort.prototype.getPath = function() {
  return this.getParent().getPath() + "/" + this.getName();
};

exports.InputPort.prototype.getPath = function() {
  return this.getParent().getPath() + "/" + this.getName();
};

function validatePortType(type, value) {
  switch (type) {
    case Type.BUF:
      return value;
    case Type.ANY:
    case Type.EXT:
    case Type.OBJECT:
    case Type.OBJ: // There is no OBJ type in the Type enum, but several nodeDefns use it
    case Type.MUX:
      return value;
    case Type.STRING:
      return value; // + ""; Force coercion?
    case Type.ARRAY:
      if (typeof value === "string") {
        value = value.split(/[,_ -]/).map(Number.parseFloat);
      }
      return value;
    case Type.ENUM:
      // We could validate the value against the ports' declared enum, but that would require a reference to the port and the enum values to persist when nodes are edited.
      return value;
    case Type.INT:
//      var t = typeof value;
//      if (t === "string") {
//        // return Number.parseInt(value, 10);
//      }
//      else {
//        return (+value) >>> 0;
//      }
//      break;
      value = value >>> 0;
      // NaN trap
      if (Number.isNaN(value)) {
        return;
      }
      return value;
    case Type.HEX:
      value = Number.parseInt(value, 16);
      // NaN trap
      if (Number.isNaN(value)) {
        return;
      }
      return value;
    case Type.NUM:
    case Type.FLOAT:
//      if (typeof value === "string") {
//        return Number.parseFloat(value);
//      }
//      else {
//        return +value;
//      }
      value = +value;
      // NaN trap
      if (Number.isNaN(value)) {
        return;
      }
      return value;
    case Type.ZEROTOONE: // We could clip or otherwise enforce this constraint
      value = +value;
      if (Number.isNaN(value)) {
        return;
      }
      if (value < 0) {
        value = 0;
      }
      if (value > 1) {
        value = 1;
      }
      return value;
    case Type.BOOL:
      return (value !== "false") && !!value;
    case Type.COLOR:
      // console.log(typeof value, value, value.toString(16));
      return ('#' + value.toString(16));
    default:
      return undefined;
  }
}

exports.Direction = Direction;
exports.Type = Type;
exports.DefaultValue = DefaultValue;
