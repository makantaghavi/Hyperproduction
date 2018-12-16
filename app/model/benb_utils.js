//var l = require("./log.js");

exports.forEachObjKey = function(obj, cb) {

  var args = Array.prototype.slice.call(arguments);
  args.shift();
  args.shift();

  var objkeys = Object.keys(obj);
  for (var i = 0; i < objkeys.length; i++) {
    var tmpargs = args.slice(0);
    if (obj[objkeys[i]]) {
      tmpargs.unshift(obj[objkeys[i]]);
      tmpargs.unshift(objkeys[i]);
      //l.debug("BB TMPARGS:");
      //l.debug(tmpargs);
      cb.apply(this, tmpargs);
      // cb.call(this, objkeys[i], obj[objkeys[i]]);
    }
  }
//  var objkeys = Object.keys(obj);
//  for (var i = 0; i < objkeys.length; i++) {
//    console.log(i);
//    cb.call(this, objkeys[i], obj[objkeys[i]]);
//  }
};


exports.uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
};

exports.defineEnum = function (enumList) {
    var propDef = {};
    enumList.forEach(function(entry) {
        propDef[entry.toString().toUpperCase()] = {
            writable: false,
            configurable: false,
            enumerable: true,
            value: entry
        };
    });
    var oEnum = Object.create(null, propDef);
    Object.freeze(oEnum);
    return oEnum;
};
