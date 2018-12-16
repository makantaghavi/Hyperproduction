var Type = require("hp/model/ports").Type;
var WebSocket = require("ws");
var WebSocketServer = require('ws').Server;

exports.WSTransceiver = {
	nodetype: "WSTransceiver",
	descr: "Receives websockets",
	path: __filename,
	inputs: {
		host: {type: Type.STRING, defaultValue:"ws://oscar.media.mit.edu:14663"},
		objIn: {type: Type.OBJECT, defaultValue:{}},
		initObj: {type: Type.OBJECT, defaultValue: {address: "/hello", arguments: "['world']"} }
	},
	outputs: {
		objOut: {type: Type.ANY, defaultValue:{}}
	},
	initFn : function(ports, state, name, emt) {
		var that = this;
		var make_ws_client = function() { 


		    state.wsc = new WebSocket(ports.host.get());

		    state.wsc.addEventListener("close", function() {
		      err_count += 1;
		      if (err_count%20 == 1) console.log("["+err_count+"x] Connection to interaction host closed, trying every 1 sec...");
		      setTimeout(make_ws_client,1000);
		    });

		    state.wsc.addEventListener('open', function() {
		      console.log ("CONNECTED TO WS HOST! "+ports.host.get());
		      state.wsc.send(JSON.stringify(ports.initObj.get()));
		      //aggregator_functions();
		      err_count = 0;
		    });

		    state.wsc.addEventListener('error', function() {
		      err_count += 1;
		      if (err_count%20 == 1) console.log("["+err_count+"x] Error connecting to interaction host, trying every 1 sec...");      
		      setTimeout(make_ws_client,1000);
		    });

		    state.wsc.on('message', function(message, flags) {
		      that.parseMsg(ports,message);
		    });

		}
		make_ws_client();

	},
	procfn : function(ports, state, id, triggerPort, emt) {
		if (triggerPort.name==="objIn" && state.wsc) {
			state.wsc.send(JSON.stringify(triggerPort.get()));
		}
	},
	parseMsg : function(ports,msg) {
		ports.objOut.set(msg);
	}
};

exports.PowersLiveGroupCue = {
	nodetype: "PowersLiveGroupCue",
	descr: "Generates cue websocket for PowersLive, takes incoming cue number as integer and string for distribution group.",
	path: __filename,
	inputs: {
		group: {type: Type.STRING, defaultValue:"fensadense"},
		cueNum: {type: Type.OBJECT, defaultValue:0},
	},
	outputs: {
		wsOut: {type: Type.ANY, defaultValue:""}
	},
	procfn : function(ports, state, id, triggerPort, emt) {
		if (triggerPort.name === "cueNum") {
			ports.wsOut.set({address:"/cue/trigger/ondemand",arguments:[ports.cueNum.get(), ports.group.get()]});
		}
	}	
}

exports.PowersLiveServer = {
	nodetype: "PowersLiveServer",
	descr: "A paired down version of the powers live server for sending data.",
	path: __filename,
	inputs: {
		cue: {type: Type.OBJECT, defaultValue:{}},
		wsGroupCueIn: {type: Type.OBJECT, defaultValue:{}},
		listenPort: {type: Type.INT, defaultValue:8080}
	},
	outputs: {
	},
	initFn : function(ports, state, name, emt) {
		state.server = new PowersLiveServer(ports.listenPort.get());
	},
	procfn : function(ports, state, id, triggerPort, emt) {
		if (triggerPort.name === "cue") {
			var cue = triggerPort.get();
			if (cue.hasOwnProperty('client'))  {
				state.server.broadcast_cue_num(cue.num, cue.client);
			} else {
				state.server.broadcast_cue_num(cue.num);
			}
		}

		else if (triggerPort.name=== "wsGroupCueIn") {
			var cue = triggerPort.get();
			state.server.broadcast_cue_num(cue.arguments[0], cue.arguments[1]);
		}
	}	
}



/* ======= POWERS LIVE ========== */

var PowersLiveServer = function(listenPort) {

	var active_prog=0;
	var active_note=0;


	// -------------------------------------------------
	// Socket Responses
	//

	var client_list = {};

	var update_client_list = function(name,ws) {
		if (ws.hasOwnProperty('cName')) {
			delete client_list[ws.cName];
		}

		client_list[name]=ws;
		ws.cName = name;
	}

	var client_response = function (message, ws) {

	        //console.log('received: %s', message);
	      try {
	          var msg = JSON.parse(message);
	          console.log("GotMSG: "+JSON.stringify(msg));
	          switch (msg.address) {
	            case "/update" : ws.send(JSON.stringify({'address': '/trigger', 'arguments': [128*active_prog+active_note]})); break;
	            //case "/content_version" :  ws.send_content_version(); break;
	            case "/echo" : ws.send(JSON.stringify({"address": "/echo"})); break;
	            //case "/client" : ws.admin_data.client_string = msg['arguments']; break;
	            //case "/device" : ws.admin_data.device_string = msg['arguments']; ws.record_location_data(); break;
	            //case "/status" : ws.admin_data.status_string = msg['arguments']; break;
	            case "/interaction" : ws.interaction_data = msg['arguments']; break;
	            case "/name" : update_client_list(msg['arguments'][0],ws); console.log(Object.keys(client_list)); break;
	            default : console.log("Unrecognized message!");
	          }
	      } catch(err) {
	        console.log("Could not parse received msg as JSON: "+err+"\n msg: "+message);
	      }
	}

	var admin_response = function (message,ws) {
	      try {
	          var msg = JSON.parse(message);
	          //console.log("GotAdminMSG: "+JSON.stringify(msg));
	          switch (msg.address) {
	            case "/midi_broadcast_enabled" : midi_broadcast_enabled = msg['arguments'][0]; console.log("midi_broadcast_enabled: "+midi_broadcast_enabled); break;
	            case "/send_cue_num" : broadcast_cue_num(msg['arguments'][0], broadcast_all); break;
	            case "/send_msg" : broadcast_all(stripslashes(msg['arguments'][0])); break;
	            case "/reload" : reload_server_config();
	            case "/set_global" : set_global(msg.arguments[0], msg.arguments[1]);
	            default : console.log("Unrecognized message!");
	          }
	      } catch(err) {
	        console.log("Could not parse received msg as JSON: "+err);
	      }
	}

	var interaction_response = function (message,ws) {
	      try {
	          var msg = JSON.parse(message);
	          switch (msg.address) {
	            case "/cue/trigger" : broadcast_cue_num(msg['arguments'][0], broadcast_all); break;
	            case "/send_msg" : broadcast_all(stripslashes(msg['arguments'][0])); break;
	            case "/mobile/intensity" : broadcast_all_live_params(JSON.stringify({'address': '/data', 'arguments': {'intensity': msg.arguments[0]}})); break;
	            case "/set_global" : set_global(msg.arguments[0], msg.arguments[1]);
	            default : break;//console.log("Unrecognized message!");
	          }
	      } catch(err) {
	        console.log("Could not parse received msg as JSON: "+err);
	      }
	}


	var make_ws_server = function(host){
	  var tmpwss = new WebSocketServer(host);

	  tmpwss.broadcast = function(data) {
	  // if (TESTING_ONLY) {
	  //   //Do the testing clients only
	  //   var that = this;
	  //   test_dev_db.lrange(TESTINGKEY, 0, -1, function(err,devices) {
	  //           //console.log("TESTING ONLY BCAST "+JSON.stringify(devices));
	  //     var ad;
	  //           for(var i in that.clients) {
	  //       //console.log("--testing: "+that.clients[i].admin_data.device_string.uuid);
	  //       ad = that.clients[i].admin_data;
	  //       if (ad && ad.device_string) {
	  //         var tuuid = ad.device_string.uuid || 0;
	  //         //console.log("----translated: "+tuuid);
	  //         try {
	  //                        if (devices.indexOf(tuuid)>-1 || tuuid.indexOf("00000000") == 0) {
	  //               that.clients[i].send(data);
	  //           }
	  //         } catch (err) {
	  //           console.log("--DB Returned non-array!" + err);
	  //           console.log(devices);
	  //           console.log(JSON.stringify(devices));
	  //         }
	  //       }
	  //                 }
	  //   });
	  // } else {
	        for(var i in this.clients) {
	              this.clients[i].send(data);
	    // }
	  }
	  
	  };

	  tmpwss.broadcast_live_params = function(data) {
	    for(var i in this.clients) {
	      //console.log(" HEY! "+JSON.stringify(this.clients[i].client_string));
	      if (this.clients[i].admin_data && this.clients[i].admin_data.client_string && this.clients[i].admin_data.client_string.live_params) {
	          this.clients[i].send(data);
	        }
	    }
	  };

	  return tmpwss;
	}

	// -------------------------------------------------
	// Client Server!
	// 

	var wss_client_count = 0;
	var wss = make_ws_server({port: listenPort});
	console.log("Created websocket server.");
	wss.on('connection', function(ws) {
	    //client_response_functions(ws);
	    wss_client_count += 1;
	    console.log(timeStamp()+" NEW CLIENT: "+wss_client_count);
	    ws.on('message', function(message) {
	      //console.log('received: %s', message);
	      client_response(message,ws);
	    });
	    ws.on('close', function(){
	      wss_client_count-=1;
	      if (ws.hasOwnProperty('cName')) {
	      		delete client_list[ws.cName];
	    	}
	      console.log(timeStamp()+" CONNECTION CLOSED: "+wss_client_count);
	    });

	    ws.on('error', function(err) {
	      console.log("Error in socket: "+err);
	    })
	    //ws.send_content_version();
	});


	// -------------------------------------------------
	// Broadcast functions
	// 

	//var broadcast_servers = [admin_wss, wss];
	var broadcast_servers = [wss];

	this.send_to_client = function(client,data) {
		client_list[client].send(data);
	}

	this.broadcast_all = function(data) {
	  for (var i in broadcast_servers)
	    broadcast_servers[i].broadcast(data);
	    // admin_wsc.send(data, function(err) {
	    //   //console.log(err);
	    //   return;
	    // });
	}

	this.broadcast_all_live_params = function(data) {
	  for (var i in broadcast_servers)
	    broadcast_servers[i].broadcast_live_params(data);
	  // admin_wsc.send(data, function(err) {
	  //   return;
	  // })
	}

	this.broadcast_note = function(note,client,broadcast_fn) {
	  broadcast_fn = broadcast_fn || this.broadcast_all;
	  var pitch = note[1];
	  var vel = note[2];
	  var msg = JSON.stringify({'address': '/trigger', 'arguments': [128*active_prog+pitch]});
	  if (vel>0) {
	    if (client) {
	    	this.send_to_client(client, msg);
	    } else {
	    	broadcast_fn(msg);
	    }

	    active_note = pitch; 
	    console.log("   -- StdNote: "+ (128*active_prog+pitch)+ " | note:"+pitch+" prog:"+active_prog);
	  }
	}


	// 
	// Admin broadcasts
	// 
	this.broadcast_cue_num = function(num,client,broadcast_fn) {
	  broadcast_fn = broadcast_fn || this.broadcast_all;
	  var msg = JSON.stringify({'address': '/trigger', 'arguments': [num]});	  
	  if (client) {
	  	this.send_to_client(client, msg);
	  } else {
	   	broadcast_fn(msg);
	  }
	  // if (!TESTING_ONLY) {
	  active_note = num&127;
	  active_prog = num>>7;
	  // }
	  console.log(" -- MANUAL Note: "+ (num));
	  console.log("note:"+active_note+" prog:"+active_prog)
	}

	this.broadcast_note_prog = function(note,prog,broadcast_fn) {
	  broadcast_fn = broadcast_fn || this.broadcast_all;
	  active_note = note; 
	  active_prog = prog; 
	  var msg = JSON.stringify({'address': '/trigger', 'arguments': [128*active_prog+note]});
	  broadcast_fn(msg);
	  console.log(" -- Note: "+ (128*active_prog+note));  
	}



}


/** ----- **/

function stripslashes (str) {
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: Ates Goral (http://magnetiq.com)
  // +      fixed by: Mick@el
  // +   improved by: marrtins
  // +   bugfixed by: Onno Marsman
  // +   improved by: rezna
  // +   input by: Rick Waldron
  // +   reimplemented by: Brett Zamir (http://brett-zamir.me)
  // +   input by: Brant Messenger (http://www.brantmessenger.com/)
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // *     example 1: stripslashes('Kevin\'s code');
  // *     returns 1: "Kevin's code"
  // *     example 2: stripslashes('Kevin\\\'s code');
  // *     returns 2: "Kevin\'s code"
  return (str + '').replace(/\\(.?)/g, function (s, n1) {
    switch (n1) {
    case '\\':
      return '\\';
    case '0':
      return '\u0000';
    case '':
      return '';
    default:
      return n1;
    }
  });
}

function timeStamp() {
// Create a date object with the current time
  var now = new Date();
 
// Create an array with the current month, day and time
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
 
// Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
 
// Determine AM or PM suffix based on the hour
  var suffix = ( time[0] < 12 ) ? "AM" : "PM";
 
// Convert hour from military time
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
 
// If hour is 0, set it to 12
  time[0] = time[0] || 12;
 
// If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }
 
// Return the formatted string
  return date.join("/") + " " + time.join(":") + " " + suffix;
}	
