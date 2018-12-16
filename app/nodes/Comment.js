var Type = require("hp/model/ports").Type;

exports.Comment = {
  nodetype: "Comment",
  descr : "Comment",
  path: __filename,
  inputs : {
    width: {type: Type.INT, defaultValue: 200, hidden: true},
    height: {type: Type.INT, defaultValue: 200, hidden: true},
    comment: {type: Type.STRING, defaultValue: 0},
  },
  outputs : {
  },
  procfn : function(ports, state, id, triggerPort) {
    
  }
};
