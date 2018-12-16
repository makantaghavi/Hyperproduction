var Type = require("hp/model/ports").Type;
var MIDIFile = require("MIDIFile");
var osc = require('osc-min');
var fs = require('fs');

/* FIXME: This shouldn't be necessary if we can prepend OSC addresses. */
var MIDI_OSC_PREFIX = "/fensadense/midi";

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

var MemoryBackedMIDIFilePlaybackStream = function (path) {
  var that = this;
  this.events = [];
  this.duration = 0;

  //Read in lines to data
  fs.readFile(path, function (err, data) {
    if (err) {
      throw err;
    }
    var midiFile = new MIDIFile(toArrayBuffer(data));
    that.events = midiFile.getMidiEvents();
    that.duration = that.events[that.events.length - 1].playTime;
  });


  //Takes time in ms relative to start of file data.
  this.seekTo = function (timestamp) {

    // BROKEN BINARY SEARCH! FIX LATER...
    // var idx = bs(data, timestamp, function(a, b) { return a.timestamp-b.timestamp; });
    // //we don't care if result was found or not, take the nearest neighbor
    // idx = idx < 0 ? ~idx : idx;

    for (var idx = 0; idx < this.events.length; idx++) {
      if (this.events[idx].playTime >= timestamp) {
        break;
      }
    }

    //return an iterator that lets us scan forward
    return {
      next: function () {
        if (this.events.length > 0) {
          var out = this.events[idx];
          idx++;
          return {
            value: out,
            done: (idx >= this.events.length)
          };
        }
        else {
          return {
            value: null,
            done: true
          };
        }
      }.bind(this)
    };
  };
};

exports.MidiPlayback = {
  nodetype: "MidiPlayback",
  descr: "Play back MIDI files.",
  path: __filename,
  initFn: function (ports, state, name, emt) {
    if (ports.filename.get()) {
      state.pb = new MemoryBackedMIDIFilePlaybackStream(ports.filename.get());
      ports.duration.set(state.pb.duration);
    }
    state.loopCount = 0;
  },
  procfn: function (ports, state, id, triggerPort) {
    if (state.pb && triggerPort === ports.externalClock && ports.chaseExternalClock.get() && ports.play.get()) {
      var currentTime = +ports.externalClock.get() * 1000 - state.loopCount * state.pb.duration;

      if (state.out) {
        //If we are already running, update current time.
        // currentTime += (tickData.currentTick - tickData.prevTick);
      }
      else {
        //If we have just clicked play, get the first data to output.
        state.out = state.iterator.next();
      }
      while (!state.out.done && state.out.value.playTime <= currentTime) {
        ports.data.set(state.out.value);
        ports.event.set(new MIDIEvent(state.out.value.subtype, state.out.value.channel, state.out.value.param1, state.out.value.param2));
        state.out = state.iterator.next();
        ports.done.set(state.out.done);
      }

      if (state.out.done && ports.loop.get()) {
        currentTime = 0;
        state.loopCount++;
        ports.loopCount.set(state.loopCount);
        state.iterator = state.pb.seekTo(currentTime);
        state.out = null;
        ports.duration.set(state.pb.duration);
      }
      
      ports.currentTime.set(currentTime);
      ports.duration.set(state.pb.duration);
    }
    else {
      switch (triggerPort.name) {
        case "filename":
          state.pb = new MemoryBackedMIDIFilePlaybackStream(triggerPort.get());
          ports.duration.set(state.pb.duration);
          console.log("Loaded MIDI File '" + triggerPort.get() + "'.");
          break;
        case "play":
          if (state.pb && triggerPort.get()) {
            state.out = null;
            state.iterator = state.pb.seekTo(+ports.currentTime.get());
          }
          break;
        case "reset":
          state.loopCount = 0;
          ports.loopCount.set(0);
          ports.currentTime.set(0);
          ports.externalClock.set(0);
          state.pb.seekTo(0);
          break;
        default:
          break;
      }
    }
  },
  tick: function (ports, state, id, tickData) {
    if (!ports.chaseExternalClock.get() && state.pb) {
      var currentTime = +ports.currentTime.get();

      if (!ports.play.get()) {
        return;
      }

      if (state.out && !state.out.done) {
        //If we are already running, update current time.
        currentTime += (tickData.currentTick - tickData.prevTick) * ports.rate.get();
      }
      else {
        //If we have just clicked play, get the first data to output.
        state.out = state.iterator.next();
      }

      //console.log("--TICK PB", state.out.done, state.out.value.timestamp, getCurrentTime());
      while (!state.out.done && state.out.value.playTime <= currentTime) {
        ports.data.set(state.out.value);
        ports.event.set(new MIDIEvent(state.out.value.subtype, state.out.value.channel, state.out.value.param1, state.out.value.param2));
        state.out = state.iterator.next();
        ports.done.set(state.out.done);
      }

      if (state.out.done && ports.loop.get()) {
        currentTime = 0;
        state.loopCount++;
        ports.loopCount.set(state.loopCount);
        state.iterator = state.pb.seekTo(currentTime);
        state.out = null;
      }
      
      ports.currentTime.set(currentTime);
      ports.duration.set(state.pb.duration);
    }
  },
  inputs: {
    filename: {type: Type.STRING, defaultValue: ""},
    play: {type: Type.BOOL, defaultValue: false},
    externalClock: {type: Type.FLOAT, defaultValue: 0},
    chaseExternalClock: {type: Type.BOOL, defaulValue: false},
    currentTime: {type: Type.FLOAT, defaultValue: 0},
    rate: {type: Type.FLOAT, defaultValue: 1},
    loop: {type: Type.BOOL, defaulValue: false},
    reset: {type: Type.BOOL, defaultValue: false}
  },
  outputs: {
    data: {type: Type.ANY, defaultValue: {}},
    event: {type: Type.OBJECT, defaultValue: {}},
    loopCount: {type: Type.INT, defaultValue: 0},
    duration: {type: Type.FLOAT, defaultValue: 0},
    done: {type: Type.BOOL, defaultValue: false}
  }
};

/* TODO: Can we use a ptlib MIDI event type? */
var MIDIEvent = function(command, ch, note, vel) {
  this.getMsgBuf = function() {
    if (command === 9) {
      // note on
      return osc.toBuffer({
      address: MIDI_OSC_PREFIX +"/note/on",
      args: [{type:"integer", value: ch}, 
             {type:"integer", value: note}, 
             {type:"integer", value: vel}]
    });
    }
    else if (command === 8) {
      // note off
      return osc.toBuffer({
      address: MIDI_OSC_PREFIX +"/note/off",
      args: [{type:"integer", value: ch}, 
             {type:"integer", value: note}, 
             {type:"integer", value: vel}]
    });
    }
  };
};

/* TODO: Create the OSC buffers in this node, not in the MIDIEvent type.
 * Do we want to emit OSC objects, rather than buffers? Let UDP transceiver handle converting OSC to buffers?
 */
exports.MIDIEventToOSC = {
  nodetype: "MIDIEventToOSC",
  descr: "Takes MIDI Note objects with ch,note,vel,dur proporties and schedules OSC Note on and Note Off Messages for OSCBridge to consume.",
  path: __filename,
  inputs: {
    midiEvent: {type: Type.OBJECT, defaultValue:{}},
  },
  outputs: {
    oscBufOut: {type: Type.BUF, defaultValue:{}},
  },
  procfn: function(ports, state, id, triggerPort) {
    if (triggerPort === ports.midiEvent) {
      ports.oscBufOut.set(ports.midiEvent.get().getMsgBuf());
    }
  }
};
