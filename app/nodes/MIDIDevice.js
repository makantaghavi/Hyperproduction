var Type = require("hp/model/ports").Type;
var midi = require('midi');
// var jazz = require('jazz-midi');
var MidiNote = require('./MIDI').MIDINote;
var MidiUtil = require("hp/lib/ptlib/midi/Midi");
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

/* jazz-midi versions
var MIDI = null;

exports.MIDIDeviceOut = {
  nodetype: "MIDIDeviceOut",
  descr: "Sends a MIDI note",
  deprecated: false, // Until we get MIDI I/O installed
  inputs: {
    "midiNote": {type: Type.OBJECT, defaultValue: {}},
    "port": {type: Type.INT, defaultValue: 0},
    "channel": {type: Type.INT, defaultValue: 0},
    "pitch": {type: Type.INT, defaultValue: 60},
    "velocity": {type: Type.FLOAT, defaultValue: 0.8},
    "duration": {type: Type.FLOAT, defaultValue: 0.6}
  },
  outputs: {
    
  },
  initFn: function (ports, state, name, emitter) {
    state.output = new midi.output();
    // state.midi = new jazz.MIDI();
	if (!MIDI) {
      // MIDI = new jazz.MIDI();
      console.info("MIDI Inputs", MIDI.MidiInList());
      console.info("MIDI Outputs", MIDI.MidiOutList());
    }
    state.output = state.midi.MidiOutOpen(ports.port.get());
    if (name) {
      console.log("MIDI out: " + state.output);
    }
    else {
      console.warn("Could not open MIDI output.");
    }
    // state.output.openPort(0);
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.port) {
      if (state.output) {
        MIDI.MidiOutClose();
        state.output = null;
      }
      state.output = MIDI.MidiOutOpen(ports.port.get());
    }
    else if (triggerPort === ports.midiNote) {
      MIDI.MidiOut(MidiUtil.Status.NOTE_ON & MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F);
    }
    else if (triggerPort === ports.pitch || (triggerPort === ports.velocity && triggerPort.get() == 0)) {
    // state.output.sendMessage([0x80 & MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F]);
      MIDI.MidiOut(MidiUtil.Status.NOTE_ON & MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F);
    }
  }
};

exports.MIDIDeviceIn = {
  nodetype: "MIDIDeviceIn",
  descr: "Receives a MIDI note",
  deprecated: false, // Until we get MIDI I/O installed
  inputs: {
    "port": {type: Type.INT, default: 0},
    "channel": {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    "pitch": {type: Type.INT, defaultValue: 60},
    "velocity": {type: Type.FLOAT, defaultValue: 0.8},
    "duration": {type: Type.FLOAT, defaultValue: 0.6}
  },
  initFn: function (ports, state, name, emitter) {
    // state.output = new midi.output();
    // state.midi = new jazz.MIDI();
	if (!MIDI) {
      // MIDI = new jazz.MIDI();
      console.info("MIDI Inputs", MIDI.MidiInList());
      console.info("MIDI Outputs", MIDI.MidiOutList());
    }
    state.output = state.midi.MidiOutOpen(ports.port.get());
    if (name) {
      console.log("MIDI out: " + state.output);
    }
    else {
      console.warn("Could not open MIDI output.");
    }
    // state.output.openPort(0);
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.port) {
      if (state.output) {
        MIDI.MidiInClose();
        state.input = null;
      }
      state.input = MIDI.MidiInOpen(ports.port.get());
    }
    // state.output.sendMessage([0x80 & MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F]);
    else {
      MIDI.MidiOut(0x90 & MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F);
    }
  }
};
*/

/* TODO: Restructure MIDI Support
 * Have MIDIInDevice and MIDIOutDevice that pass all messages from/to a port.
 * Have filter nodes that parse out particular event types per channel to parallel the
 * event-generation nodes in MIDI.js and sort of match OSC filters and UDP transceivers.
 * 
 * This might eliminate the need for looking up existing ports? Though it'd still be
 * nice to have inputs in multiple places that reference the same port.
 * 
 * Normalize a MIDIMessage or MIDIEvent internal type. There's a MIDINote type in MIDI.js
 * and a MIDIEvent type in MIDIPlayback.js. Both of these have dubious buffer methods.
 * MIDIEvent assumes eventual OSC processing.
 */

var midiInputPorts = {};
var midiOutputPorts = {};

function openInputPort(portIdx) {
  if (midiInputPorts.hasOwnProperty(portIdx)) {
    midiInputPorts[portIdx].count++;
    return midiInputPorts[portIdx].port;
  }
  else {
    var port = new midi.input();
    port.openPort(portIdx);
    port.ignoreTypes(true, true, true);
    midiInputPorts[portIdx] = {
      count: 1,
      port: port
    };
    return port;
  }
}

function closeInputPort(portIdx) {
  if (midiInputPorts.hasOwnProperty(portIdx)) {
    midiInputPorts[portIdx].count--;
    if (midiInputPorts[portIdx].count <= 0) {
      midiInputPorts[portIdx].port.closePort();
      delete midiInputPorts[portIdx];
    }
  }
}

function openOutputPort(portIdx) {
  if (midiOutputPorts.hasOwnProperty(portIdx)) {
    midiOutputPorts[portIdx].count++;
    return midiOutputPorts[portIdx].port;
  }
  else {
    var port = new midi.output();
    port.openPort(portIdx);
    midiOutputPorts[portIdx] = {
      count: 1,
      port: port
    };
    return port;
  }
}

function closeOutputPort(portIdx) {
  if (midiOutputPorts.hasOwnProperty(portIdx)) {
    midiOutputPorts[portIdx].count--;
    if (midiOutputPorts[portIdx].count <= 0) {
      midiOutputPorts[portIdx].port.closePort();
      delete midiOutputPorts[portIdx];
    }
  }
}

exports.MIDIDeviceOut = {
  nodetype: "MIDIDeviceOut",
  descr: "Sends a MIDI note",
  inputs: {
    "midiNote": {type: Type.OBJECT, defaultValue: {}},
    "port": {type: Type.INT, defaultValue: 0},
    "channel": {type: Type.INT, defaultValue: 0},
    "pitch": {type: Type.INT, defaultValue: 60, continuous: true},
    "velocity": {type: Type.FLOAT, defaultValue: 0.8},
    "duration": {type: Type.FLOAT, defaultValue: 0.6}
  },
  outputs: {
    
  },
  initFn: function (ports, state, name, emitter) {
    state.port = ports.port.get();
    state.output = openOutputPort(state.port);
	if (state.output) {
      var count = state.output.getPortCount();
      console.info("MIDI Output Ports");
      for (var i = 0; i < count; i++) {
        console.log(i + ": " + state.output.getPortName(i));
      }
    }
    if (state.output) {
      console.log("MIDI out: " + state.port + ": " + state.output);
    }
    else {
      console.warn("Could not open MIDI output.");
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.port) {
      var port = triggerPort.get();
      if (state.port !== port) {
        closeOutputPort(state.port);
      }
      state.port = port;
      state.output = openOutputPort(state.port);
    }
    else if (triggerPort === ports.midiNote) {
      // state.output.sendMessage([MidiUtil.Status.NOTE_ON & MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F]);
      var note = ports.midiNote.get();
      state.output.sendMessage([MidiUtil.Status.NOTE_ON | note.channel, note.note, note.velocity]);
    }
    else if (triggerPort === ports.pitch || (triggerPort === ports.velocity && triggerPort.get() == 0)) {
      state.output.sendMessage([MidiUtil.Status.NOTE_ON | MathUtil.clip(ports.channel.get(), 0, 15), ports.pitch.get() & 0x7F, ((ports.velocity.get() * 0x7F) >>> 0) & 0x7F]);
    }
  }
};

exports.MIDIDeviceInNote = {
  nodetype: "MIDIDeviceInNote",
  descr: "Receives a MIDI note",
  inputs: {
    "port": {type: Type.INT, defaultValue: 0},
    "channel": {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    "pitch": {type: Type.INT, defaultValue: 60, continuous: true},
    "velocity": {type: Type.FLOAT, defaultValue: 0.8, continuous: true},
    "duration": {type: Type.FLOAT, defaultValue: 0.6},
    "midiNote": {type: Type.OBJECT, defailtValue: {}},
  },
  initFn: function (ports, state, name, emitter) {
    try {
      state.port = ports.port.get();
      state.input = openInputPort(state.port);
      if (state.input) {
        var count = state.input.getPortCount();
        console.info("MIDI Input Ports", count);
        for (var i = 0; i < count; i++) {
          console.log(i + ": " + state.input.getPortName(i));
        }
      }
  //    if (state.input.getPortCount() > 0) {
  //      state.port = 0;
  //      state.input.openPort(state.port);
  //    }
      // state.input.ignoreTypes(true, true, true);
      state.input.on("message", (deltaTime, message) => {
        var channel = ports.channel.get();
        var eChannel = message[0] & 0x0F;
        if (message.length > 2 && channel === eChannel) {
          var eStatus = message[0] & 0xF0;
          if (eStatus === MidiUtil.Status.NOTE_ON) {
            ports.pitch.set(message[1]);
            ports.velocity.set(message[2] / 0x7F);
            ports.midiNote.set(new MidiNote(channel, message[1], message[2]));
          }
          else if (eStatus === MidiUtil.Status.NOTE_OFF) {
            ports.midiNote.set(new MidiNote(channel, message[1], message[2]));
          }
        }
      });
      if (state.input) {
        console.log("MIDI in: " + state.port + ": " + state.input);
      }
      else {
        console.warn("Could not open MIDI input.");
      }
    }
    catch (e) {
      console.warn("Failed to open MIDI input port: ", state.port, e);
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.port) {
      var port = triggerPort.get();
      if (port < 0 || port > state.input.getPortCount()) {
        port = 0;
        ports.port.set(port);
      }
      if (state.port !== port) {
        // FIXME: The on-message handlers should be removed for this node.
        closeInputPort(state.port);
      }
      state.port = port;
      state.input = openInputPort(state.port);
    }
  }
};

exports.MIDIDeviceInController = {
  nodetype: "MIDIDeviceInController",
  descr: "Receives a MIDI control change",
  inputs: {
    "port": {type: Type.INT, defaultValue: 0},
    "channel": {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    "controller": {type: Type.INT, defaultValue: 7},
    "value": {type: Type.FLOAT, defaultValue: 0}
  },
  initFn: function (ports, state, name, emitter) {
    try {
      state.port = ports.port.get();
      state.input = openInputPort(state.port);
      if (state.input) {
        var count = state.input.getPortCount();
        console.info("MIDI Input Ports", count);
        for (var i = 0; i < count; i++) {
          console.log(i + ": " + state.input.getPortName(i));
        }
      }
  //    if (state.input.getPortCount() > 0) {
  //      state.port = 0;
  //      state.input.openPort(state.port);
  //    }
      // state.input.ignoreTypes(true, true, true);
      state.input.on("message", (deltaTime, message) => {
        var channel = ports.channel.get();
        var eChannel = message[0] & 0x0F;
        var eStatus = message[0] & 0xF0;
        if (eStatus === MidiUtil.Status.CONTROL_CHANGE && message.length > 2 && channel === eChannel) {
          ports.controller.set(message[1]);
          ports.value.set(message[2] / 0x7F);
        }
      });
      if (state.input) {
        console.log("MIDI in: " + state.port + ": " + state.input);
      }
      else {
        console.warn("Could not open MIDI input.");
      }
    }
    catch (e) {
      console.warn("Failed to open MIDI input port: ", state.port, e);
    }
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.port) {
      var port = triggerPort.get();
      if (port < 0 || port > state.input.getPortCount()) {
        port = 0;
        ports.port.set(port);
      }
      if (state.port !== port) {
        // FIXME: The on-message handlers should be removed for this node.
        closeInputPort(state.port);
      }
      state.port = port;
      state.input = openInputPort(state.port);
    }
  }
};

// MIDIEventFilter