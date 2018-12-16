var Type = require("../model/ports").Type;
var MathUtil = require("../lib/ptlib/util/MathUtil");

// Keyboard input

exports.KeyboardInput = {
  nodetype: "KeyboardInput",
  descr: "Listen to input from computer keyboard.",
  path: __filename,
  initFn: function (ports, state, id, emitter) {
//    if (emitter) {
//      emitter.emit('node-ui-config', 'node-ui-config', {
//        "action": "node-ui-config",
//        "id": id,
//        "ports": ports
//      });
//    }
    state.handler = function (evtType, refcon) {
      if (refcon.id === state.id && ports[refcon.port]) {
        ports[refcon.port].set(refcon.data);
      }
    };
    // ipc.on('widget-slider-slide', state.handler);
  },
  destroy: function (ports, state) {
    // ipc.removeListener("widget-slider-slide", state.handler);
  },
  procfn: function (ports, state, id, triggerPort, emitter) {
    if (emitter) {
//      emitter.emit('node-ui-config', 'node-ui-config', {
//        "action": "node-ui-config",
//        "id": id,
//        "port": triggerPort.name,
//        "data": triggerPort.get()
//      });
    }
  },
  inputs: {},
  outputs: {
    keyChar: {type: Type.STRING, defaultValue: ""},
    keyCode: {type: Type.INT, defaultValue: 0},
    isKeyDown: {type: Type.BOOL, defaultValue: false}
  },
  uiDefn: "../client/PanelKeyboardInputNode",
  variadicOutput: true,
  emitter: true
};


exports.KeyCodeToNumValue = {
  nodetype: "KeyCodeToNumValue",
  descr: "Take keyboard input and map it to specific numeric values",
  path: __filename,
  procfn: function(ports) {
      // ========
      // Map characters to numbers (using characters here for readability)
      // TODO: Put this somewhere else e.g. initfn?

      // ----
      // USERS: CHANGE THIS MAPPING HERE
      // In this default example we're mapping to MIDI note pitches,
      // much like you'd see in a "musical typing" feature in a DAW
      var keyCharMappings = {
        "a": 60,
        "w": 61,
        "s": 62,
        "e": 63,
        "d": 64,
        "f": 65,
        "t": 66,
        "g": 67,
        "y": 68,
        "h": 69,
        "u": 70,
        "j": 71,
        "k": 72,
        "o": 73,
        "l": 74,
        "p": 75,
        ";": 76,
        "'": 77
      };
      // ----

      // TODO: More examples.



      // ========
      // Set default value
      var outputValue = -1;

      // ========
      // Get key code from input
      var inputKeyCode = ports.keyCode.get();
      console.log("inputKeyCode = " + inputKeyCode);
      // for (var input in this.inputs) {
      //   product *= ports[input].get();
      // }


      // ========
      // Convert mapping to use key codes
      // TODO: Use a library or something for this; currently uses a lookup object from this gist https://gist.github.com/codingcarpenter/a4faf6a804123bb3a5ea
      var keyCharsToKeyCodes={backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,pausebreak:19,capslock:20,esc:27,space:32,pageup:33,pagedown:34,end:35,home:36,leftarrow:37,uparrow:38,rightarrow:39,downarrow:40,insert:45,delete:46,0:48,1:49,2:50,3:51,4:52,5:53,6:54,7:55,8:56,9:57,a:65,b:66,c:67,d:68,e:69,f:70,g:71,h:72,i:73,j:74,k:75,l:76,m:77,n:78,o:79,p:80,q:81,r:82,s:83,t:84,u:85,v:86,w:87,x:88,y:89,z:90,leftwindowkey:91,rightwindowkey:92,selectkey:93,numpad0:96,numpad1:97,numpad2:98,numpad3:99,numpad4:100,numpad5:101,numpad6:102,numpad7:103,numpad8:104,numpad9:105,multiply:106,add:107,subtract:109,decimalpoint:110,divide:111,f1:112,f2:113,f3:114,f4:115,f5:116,f6:117,f7:118,f8:119,f9:120,f10:121,f11:122,f12:123,numlock:144,scrolllock:145,semicolon:186,equalsign:187,comma:188,dash:189,period:190,forwardslash:191,graveaccent:192,openbracket:219,backslash:220,closebracket:221,singlequote:222};
      var keyCodeMappings = {};

      for (var keyChar in keyCharMappings) {
        // keyCodeMappings[keyChar.charCodeAt(0)] = keyCharMappings[keyChar];
        if (keyCharsToKeyCodes.hasOwnProperty(keyChar)) {
          keyCode = keyCharsToKeyCodes[keyChar];
          keyCodeMappings[keyCode] = keyCharMappings[keyChar];
        }
      };


      // =========
      // Set & send value for input key code, if found
      if (keyCodeMappings.hasOwnProperty(inputKeyCode)) {
        outputValue = keyCodeMappings[inputKeyCode];
        console.log("outputValue = " + outputValue);

        ports.numValue.set(outputValue);
      }
      else {
        // console.log("keyCode " + inputKeyCode + " was not found in ");
        // console.log(keyCodeMappings);
      }

    },
  inputs: {
    keyCode: {type: Type.INT, defaultValue: 0},
  },
  outputs: {
    numValue: {type: Type.NUM, defaultValue: 0.0},
  },
  variadicInput: true
};

exports.KeyboardInputToMIDINote = {
  nodetype: "KeyboardInputToMIDINote",
  descr: "Take keyboard input and map it to MIDI notes, using key code as pitch",
  path: __filename,
  procfn: function(ports) {
      // TODO: Consolidate this with KeyCodeToNumValue?

      // ========
      // Set default value
      var note = {};

      // ========
      // Get key code from input
      var inputKeyCode = ports.keyCode.get();
      var inputIsKeyDown = ports.isKeyDown.get();
      console.log("inputKeyCode=" + inputKeyCode + ", inputIsKeyDown=" + inputIsKeyDown);
      // for (var input in this.inputs) {
      //   product *= ports[input].get();
      // }

      // Ignore invalid key codes
      if (inputKeyCode == 0) {
        return;
      }


      // =========
      // Construct MIDI note
      note.channel = ports.channel.get();
      note.note = Math.min(Math.max(0, inputKeyCode), 127);
      note.velocity = inputIsKeyDown ? ports.velocity.get() : 0;
      console.log(note);

      // ========
      // Send MIDI note
      ports.midiNote.set(note);
      console.log("Sent MIDI note!");
    },
  inputs: {
    keyCode: {type: Type.INT, defaultValue: 0},
    isKeyDown: {type: Type.BOOL, defaultValue: false},
    channel: {type: Type.INT, defaultValue: 0},
    velocity: {type: Type.INT, defaultValue: 64}
  },
  outputs: {
    // numValue: {type: Type.NUM, defaultValue: 0.0},
    midiNote: {type: Type.OBJECT, defaultValue: {}}
  },
  variadicInput: true
};


// exports.KeyCodeToMIDINote = {
//   nodetype: "KeyCodeToMIDINote",
//   descr: "Take keyboard input and send it as MIDI.",
//   path: __filename,
//   initFn: function (ports, state, id, emitter) {
// //    if (emitter) {
// //      emitter.emit('node-ui-config', 'node-ui-config', {
// //        "action": "node-ui-config",
// //        "id": id,
// //        "ports": ports
// //      });
// //    }
//     state.handler = function (evtType, refcon) {
//       if (refcon.id === state.id && ports[refcon.port]) {
//         ports[refcon.port].set(refcon.data);
//       }
//     };
//     // ipc.on('widget-slider-slide', state.handler);
//   },
//   destroy: function (ports, state) {
//     // ipc.removeListener("widget-slider-slide", state.handler);
//   },
//   procfn: function (ports, state, id, triggerPort, emitter) {
//     if (emitter) {
// //      emitter.emit('node-ui-config', 'node-ui-config', {
// //        "action": "node-ui-config",
// //        "id": id,
// //        "port": triggerPort.name,
// //        "data": triggerPort.get()
// //      });
//     }
//   },
//   inputs: {
//     keyCode: {type: Type.INT, defaultValue: 0},
//     isKeyDown: {type: Type.BOOL, defaultValue: false}
//   },
//   outputs: {
//     midiNote: {type: Type.OBJECT, defaultValue: {}}
//   },
//   uiDefn: "../client/PanelKeyCodeToMIDINoteNode",
//   variadicOutput: true,
//   emitter: true
// };

