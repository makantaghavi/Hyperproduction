var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;

exports.Switcher = {
	nodetype: "Switch",
    descr: "Switches between different presets.",
    path: __filename,
    inputs: {
	    preset1: {type: Type.BOOL, defaultValue:true},
	    preset2: {type: Type.BOOL, defaultValue:false},      
	    preset3: {type: Type.BOOL, defaultValue:false},
	    preset4: {type: Type.BOOL, defaultValue:false},
	    preset5:  {type: Type.BOOL, defaultValue:false}
  	},
    outputs: {
    	output1: {type: Type.BOOL, defaultValue:true},
    	output2: {type: Type.BOOL, defaultValue:false},
    	output3: {type: Type.BOOL, defaultValue:false},
    	output4: {type: Type.BOOL, defaultValue:false},
    	output5: {type: Type.BOOL, defaultValue:false}
  	},
  	
      initFn: function (ports, state, name, emt) {
	    state.outputs = [];
	    state.inputs=[];
	    for (var p in ports) {
	      var port = ports[p];
	      if (port.direction ==='OUTPUT'){
	        state.outputs.push(port);
	      }

	      else{
	       	state.inputs.push(port);
	       }
	     }
	  },


	procfn: function (ports, state, id, triggerPort) {

      if (!triggerPort.get()) {
        return;
      }
      for(var i=0; i<state.inputs.length;i++){
      	if(state.inputs[i].name!==triggerPort.name){
      		console.log("Setting false", state.inputs[i].name);
      		state.inputs[i].set(false)
      		state.outputs[i].set(false)
      	}
      	else{
      		state.outputs[i].set(true)
      	}
      }
  

    }
};


