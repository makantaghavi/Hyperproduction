var Type = require("hp/model/ports").Type;
var osc = require('osc-min');
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
var MusicUtil = require("hp/lib/ptlib/util/MusicUtil");
var MidiUtil = require("hp/lib/ptlib/midi/Midi");
var GeneralMidi = require("hp/lib/ptlib/midi/GeneralMidi");

const MIDI_OSC_PREFIX = "/midi";

// TODO: I never quite understood the purpose of dealing with buffers here or why the MIDINote object should be responsible for creating the OSC/buffer. If anything, consider MIDI nodes inputting and outputting OSC messages instead of buffers.
var MIDINote = function(ch, note, vel, dur) {
  this.channel = ch || 0;
  this.note = note || MidiUtil.A_MIDI;
  this.velocity = vel || 100;
  this.dur = dur || 0; 
  //dur of 0 means infinite note duration
  
  this.getOnMsgBuf = function(port) {
    return osc.toBuffer({
      address: MIDI_OSC_PREFIX + ((typeof port !== "undefined" && port > -1) ? "/" + port : "") + "/note/on",
      args: [{type:"integer", value: ch},
             {type:"integer", value: note},
             {type:"integer", value: vel}]
    });
  };

  this.getOffMsgBuf = function(port) {
    return osc.toBuffer({
      address: MIDI_OSC_PREFIX + ((typeof port !== "undefined" && port > -1) ? ("/" + port) : "") + "/note/off",
      args: [{type:"integer", value: ch},
             {type:"integer", value: note},
             {type:"integer", value: 0}]
    });
  };
};
exports.MIDINote = MIDINote;

exports.FreqToMidi = {
  nodetype: "FreqToMidi",
  descr: "Converts the given frequency value into a MIDI note number",
  path: __filename,
  inputs: {
    frequency: {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
    midiPitch: {type: Type.INT, defaultValue: MidiUtil.A_MIDI}
  },
  procfn: function (ports, state) {
    ports.midiPitch.set(Math.round(12 * Math.log(ports.frequency.get() / MidiUtil.A_FREQ) / MathUtil.LOG2) + MidiUtil.A_MIDI);
  }
};

exports.OctaveInterval = {
  nodetype: "OctaveInterval",
  descr: "Converts the given MIDI pitch value into an interval and octave",
  path: __filename,
  inputs: {
    note: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    interval: {type: Type.INT, defaultValue: 0},
    octave: {type: Type.INT, defaultValue: 0},
    octaveRoot: {type: Type.INT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    var n = ~~ports.note.get();
    ports.interval.set(n % 12);
    ports.octave.set(~~(n / 12) - 1);
    ports.octaveRoot.set(~~(n / 12) * 12);
  }
};

// This is functionally the same as From2D with a fixed width of 128
exports.NoteModeTrigger = {
  nodetype: "NoteModeTrigger",
  descr: "Combines a note number and a mode number into a trigger number",
  path: __filename,
  inputs: {
    note: {type: Type.INT, defaultValue: 0, continuous: true},
    mode: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    trigger: {type: Type.INT, defaultValue: 0}
  },
  procfn: function (ports, state) {
    ports.trigger.set(ports.mode.get() * 128 + ports.note.get());
  }
};

exports.MusicalScale = {
  nodetype: "MusicalScale",
  descr: "Provides an array of intervals in the given scale.",
  path: __filename,
  inputs: {
    select: {type: Type.STRING, enum: Object.keys(MusicUtil.SCALES), defaultValue: "chromatic", fixed: true}
  },
  outputs: {
    scale: {type: Type.ARRAY, defaultValue: MusicUtil.SCALES.CHROMATIC, fixed: true}
  },
  procfn: function (ports, state) {
    var key = ports.select.get().toUpperCase();
    var v = MusicUtil.SCALES[key];
    if (typeof v !== "undefined") {
      ports.scale.set(v);
    }
  }
};

exports.Chord = {
  nodetype: "Chord",
  descr: "Provides an array of intervals in the given chord.",
  path: __filename,
  inputs: {
    select: {type: Type.STRING, enum: Object.keys(MusicUtil.CHORDS), defaultValue: "major_triad", fixed: true}
  },
  outputs: {
    chord: {type: Type.ARRAY, defaultValue: MusicUtil.CHORDS.MAJOR_TRIAD, fixed: true}
  },
  procfn: function (ports, state) {
    var key = ports.select.get().toUpperCase();
    if (MusicUtil.CHORDS.hasOwnProperty(key)) {
      ports.chord.set(MusicUtil.CHORDS[key]);
    }
  }
};

exports.TensionIntervals = {
  nodetype: "TensionIntervals",
  path: __filename,
  inputs: {
    transpose: {type: Type.INT, defaultValue: 0, fixed: true}
  },
  outputs: {
    intervals: {type: Type.ARRAY, defaultValue: MusicUtil.TENSION_SORTED_INTERVALS, fixed: true}
  },
  procfn: function (ports, state) {
    var transpose = +ports.transpose.get();
    if (transpose) {
      ports.intervals.set(MusicUtil.TENSION_SORTED_INTERVALS.map(function (a) {return a + transpose;}));
    }
    else {
      ports.intervals.set(MusicUtil.TENSION_SORTED_INTERVALS);
    }  
  }
};

exports.MIDIRandomNotesGenerator = {
  nodetype: "MIDIRandomNotesGenerator",
  descr: "Generates a random cloud of notes of varying width, velocity, rate, and centers for all those parameters.",
  path: __filename,
  inputs: {
      velocityCenter: {type: Type.INT, defaultValue: 100},
      velocityWidth: {type: Type.INT, defaultValue: 0},
      rateCenter: {type: Type.FLOAT, defaultValue: 1},
      rateWidth: {type: Type.FLOAT, defaultValue: 0},
      noteCenter: {type: Type.INT, defaultValue: 60},
      noteWidth: {type: Type.INT, defaultValue: 0},
      durationCenter: {type: Type.INT, defaultValue: 500},
      durationWidth: {type: Type.INT, defaultValue: 0},
      channel: {type: Type.INT, defaultValue: 0},
  },
  outputs: {
      noteOut: {type: Type.OBJECT, defaultValue: {}}
  },
  initFn: function(ports,state,name,emt) {
      state.msToNextNote = 0;
      state.activeNotes = {};
      state.msBetweenNotes = 1000 / ports.rateCenter.get();
      state.msBetweenNotesVariation = ports.rateWidth.get() === 0 ? 0 : (1000 / ports.rateWidth.get());
  },
  tick: function (ports, state, id, tickData) {


    if  (state.msToNextNote <= 0) {
      //play a note and get a new state.msToNextNote
      // to play the note, we need to generate a duration
      
      var note = MathUtil.clip(ports.noteCenter.get(), 0, 127);
      if (ports.noteWidth.get() !== 0) {
        note += (Math.random()*2-1)*ports.noteWidth.get();
      }

      var velocity = MathUtil.clip(ports.velocityCenter.get(), 0, 127);
      if (ports.velocityWidth.get() !== 0) {
        velocity += (Math.random()*2-1)*ports.velocityWidth.get();
      }

      var duration = ports.durationCenter.get() > 0 ? ports.durationCenter.get() : 1;
      if (ports.durationWidth.get() !== 0) {
        duration += (Math.random()*2-1)*ports.durationWidth.get();
      }

      ports.noteOut.set(new MIDINote(ports.channel.get(), note, velocity, duration));
      state.msToNextNote = state.msBetweenNotes + ((Math.random()*2-1)*state.msBetweenNotesVariation);

    } else {

      state.msToNextNote -= (tickData.currentTick - tickData.prevTick);

    }
    
  },
  procfn: function(ports, state, id, triggerPort) {
    //rateCenter: notes/sec
    //rateWidth: +- notes/sec
    state.msBetweenNotes = ports.rateCenter.get() === 0 ? 1000 : (1000 / ports.rateCenter.get());
    state.msBetweenNotesVariation = ports.rateWidth.get() === 0 ? 0 : (1000 / ports.rateWidth.get());
  }
};

exports.MIDIArrayRandomNotesGenerator = {
  nodetype: "MIDIArrayRandomNotesGenerator",
  descr: "Generates a random cloud of notes of varying width, velocity, rate, and centers for all those parameters.",
  path: __filename,
  inputs: {
    velocityCenter: {type: Type.INT, defaultValue: 100},
    velocityWidth: {type: Type.INT, defaultValue: 0},
    rateCenter: {type: Type.FLOAT, defaultValue: 1},
    rateWidth: {type: Type.FLOAT, defaultValue: 0},
    noteCenter: {type: Type.INT, defaultValue: 60},
    noteIntervalList: {type: Type.INT, defaultValue: [0]},
    noteListWidth: {type: Type.ZEROTOONE, defaultValue: 0},
    numberNotes: {type: Type.INT, defaultValue: 1},
    octaveWidth: {type: Type.INT, defaultValue: 0},
    noteWidth: {type: Type.INT, defaultValue: 0},
    noteWidthProb: {type: Type.FLOAT, defaultValue: 0},
    durationCenter: {type: Type.INT, defaultValue: 500},
    durationWidth: {type: Type.INT, defaultValue: 0},
    channel: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
      noteOut: {type: Type.OBJECT, defaultValue: {}},
  },
  initFn: function(ports,state,name,emt) {
      state.msToNextNote = 0;
      state.activeNotes = {};
      state.msBetweenNotes = 1000 / ports.rateCenter.get();
      state.msBetweenNotesVariation = ports.rateWidth.get() === 0 ? 0 : (1000 / ports.rateWidth.get());
  },
  tick: function (ports, state, id, tickData) {
    if (state.msToNextNote <= 0) {
      var channel = MathUtil.clip(ports.channel.get(), 0, 15) >>> 0;
      var noteCenter = ports.noteCenter.get();
      var noteList = ports.noteIntervalList.get();
      var listWidth = MathUtil.clip(ports.noteListWidth.get(), 0, 1);
      var noteWidth = ports.noteWidth.get();
      var noteWidthProb = ports.noteWidthProb.get();
      var velocity = randMIDIRange(ports.velocityCenter.get(), ports.velocityWidth.get());
      var durationCenter = ports.durationCenter.get();
      var durationWidth = ports.durationWidth.get();
      var numNotes = Math.floor(MathUtil.clip(ports.numberNotes.get(), 1, 32));
      
      var octave;
      var octaveRange = ports.octaveWidth.get();
      for (var i = 0; i < numNotes; i++) {
        // update note params and compute interval
        octave = MathUtil.randInt(-octaveRange, octaveRange);
        ports.noteOut.set(new MIDINote(channel, randMIDIRange(noteList[~~(Math.random() * listWidth * noteList.length)] + noteCenter + (octave * 12), (Math.random() < noteWidthProb ? noteWidth : 0)), velocity, randTimeRange(durationCenter, durationWidth)));
      }
      state.msToNextNote = state.msBetweenNotes + ((Math.random()*2-1)*state.msBetweenNotesVariation);
    }
    else {
      state.msToNextNote -= (tickData.currentTick - tickData.prevTick);
    }
  },
  procfn: function(ports, state, id, triggerPort) {
    //rateCenter: notes/sec
    //rateWidth: +- notes/sec
    if (triggerPort === ports.rateCenter || triggerPort === ports.rateWidth) {
      state.msBetweenNotes = ports.rateCenter.get() === 0 ? 1000 : (1000 / ports.rateCenter.get());
      state.msBetweenNotesVariation = ports.rateWidth.get() === 0 ? 0 : (1000 * ports.rateWidth.get());
    }
  }
};

exports.MIDINoteToOSC = {
  nodetype: "MIDINoteToOSC",
  descr: "Takes MIDI Note objects with ch,note,vel,dur proporties and schedules OSC Note on and Note Off Messages for OSCBridge to consume.",
  path: __filename,
  inputs: {
    midiIn: {type: Type.OBJECT, defaultValue: {}},
    port: {type: Type.INT, defaultValue: -1}
  },
  outputs: {
    oscBufOut: {type: Type.BUF, defaultValue:{}}
  },
  procfn: function(ports, state, id, triggerPort) {
    if (triggerPort === ports.midiIn) {
      var note = triggerPort.get();
      var port = ports.port.get();
      if ((typeof note.dur === "undefined") || note.dur >= 0) {
        //Send note-on if duration is 0 or greater
        ports.oscBufOut.set(note.getOnMsgBuf(port));
      } else {
        //Send note-off if duration is less than zero
        setTimeout(ports.oscBufOut.set.bind(ports.oscBufOut), note.dur, note.getOffMsgBuf(port));
      }

      if (note.dur > 0) { 
        //If duration is greater than zero, schedule a note off
        setTimeout(ports.oscBufOut.set.bind(ports.oscBufOut), note.dur, note.getOffMsgBuf(port));
      }

    }
  }
};

exports.MIDIImpulse = {
  nodetype: "MIDIImpulse",
  descr: "If input is <sensitivity> over threshold, send MIDI note with params",
  path: __filename,
  inputs: {
    dataInput: {type: Type.NUM, defaultValue: 0},
    threshold: {type: Type.NUM, defaultValue: 0.5},
    note: {type: Type.INT, defaultValue:60},
    channel: {type: Type.INT, defaultValue:0},
    velocity: {type: Type.INT, defaultValue:100},
    duration: {type: Type.INT, defaultValue:1000}
  },
  outputs: {
    dataOutput: {type: Type.NUM, defaultValue: 0}
  },
  procfn: function(ports,state) {
    var value = ports.dataInput.get();
    var threshold = ports.threshold.get();

    var passed = (value > threshold);

    if (!state.passed && passed) {
      ports.dataOutput.set(new MIDINote(ports.channel.get(), ports.note.get(), ports.velocity.get(), ports.duration.get()));
    } 

    state.passed = passed;
  }
};

exports.MIDIProgram = {
  nodetype: "MIDIProgram",
  descr: "Generates a MIDI program change as an OSC buffer.",
  path: __filename,
  inputs: {
    channel: {type: Type.INT, defaultValue: 0},
    programName: {type: Type.STRING, defaultValue: "ACOUSTIC_GRAND_PIANO", enum: Object.keys(GeneralMidi.Instrument)},
    program: {type: Type.INT, defaultValue: GeneralMidi.Instrument.ACCOUSTIC_GRAND_PIANO},
    port: {type: Type.INT, defaultValue: -1}
  },
  outputs: {
    programOutBuf: {type: Type.BUF, defaultValue: {}}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.programName) {
      var v = GeneralMidi.Instrument[triggerPort.get()];
      if (typeof v !== "undefined") {
        ports.program.set(v);
      }
    }
    else if (triggerPort === ports.program) {
      var v = triggerPort.get();
      var found = false;
      for (var c in GeneralMidi.Instrument) {
        if (GeneralMidi.Instrument[c] === v) {
          // ports.programName.value = c;
          ports.programName.set(c);
          found = true;
          break;
        }
      }
      if (!found) {
        ports.programName.set("");
      }
    }
    else if (triggerPort === ports.program) {
      var p = ports.port.get();
      ports.programOutBuf.set(osc.toBuffer({
            address: MIDI_OSC_PREFIX + ((p > -1) ? ("/" + p) : "") + "/program",
            args: [{type:"integer", value: +ports.channel.get()}, 
                   {type:"integer", value: +ports.program.get()}]
          }));
    }
  }
};

exports.MIDIController = {
  nodetype: "MIDIController",
  descr: "Generates a MIDI controller change as an OSC buffer.",
  path: __filename,
  inputs: {
    channel: {type: Type.INT, defaultValue: 0},
    controllerName: {type: Type.STRING, defaultValue: "VOLUME", enum: Object.keys(GeneralMidi.Controller)},
    controller: {type: Type.INT, defaultValue: GeneralMidi.Controller.VOLUME},
    value: {type: Type.FLOAT, defaultValue: 0},
    port: {type: Type.INT, defaultValue: -1}
  },
  outputs: {
    ccOutBuf: {type: Type.BUF, defaultValue: {}}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.controllerName) {
      var v = GeneralMidi.Controller[triggerPort.get()];
      if (typeof v !== "undefined") {
        ports.controller.set(v);
      }
    }
    else if (triggerPort === ports.controller) {
      var v = triggerPort.get();
      var found = false;
      for (var c in GeneralMidi.Controller) {
        if (GeneralMidi.Controller[c] === v) {
          ports.controllerName.set(c);
          found = true;
          break;
        }
      }
      if (!found) {
        ports.controllerName.set("");
      }
    }
    else if (triggerPort === ports.value) {
      var p = ports.port.get();
      ports.ccOutBuf.set(osc.toBuffer({
            address: MIDI_OSC_PREFIX + ((p > -1) ? ("/" + p) : "") + "/cc",
            args: [{type:"integer", value: +ports.channel.get()}, 
                   {type:"integer", value: +ports.controller.get()}, 
                   {type:"integer", value: ~~(MathUtil.clip(+ports.value.get(), 0, 1) * 0x7F)}]
          }));
    }
  }
};

exports.MIDIPitchBend = {
  nodetype: "MIDIPitchBend",
  descr: "Generates a MIDI pitch bend change as an OSC buffer.",
  path: __filename,
  inputs: {
    channel: {type: Type.INT, defaultValue: 0},
    value: {type: Type.FLOAT, defaultValue: 0},
    port: {type: Type.INT, defaultValue: -1}
  },
  outputs: {
    pbOutBuf: {type: Type.BUF, defaultValue: {}}
  },
  procfn: function (ports, state, id, triggerPort) {
    var value = ~~MathUtil.clip((ports.value.get() + 1) / 2 * 0x3FFF, 0, 0x3FFF);
    var p = ports.port.get();
    ports.pbOutBuf.set(osc.toBuffer({
          address: MIDI_OSC_PREFIX + ((p > -1) ? ("/" + p) : "") + "/pitchbend",
          args: [{type:"integer", value: +ports.channel.get()}, 
                 {type:"integer", value: value & 0x7F},
                 {type:"integer", value: (value >>> 7) & 0x7F}]
        }));
  }
};

exports.MIDITrigger = {
  nodetype: "MIDITrigger",
  descr: "Generates a triggered random note of varying width, velocity, and centers for all those parameters.",
  path: __filename,
  inputs: {
    trigger: {type: Type.ANY, defaultValue: 0, continuous: true},
    velocityCenter: {type: Type.INT, defaultValue: 100},
    velocityWidth: {type: Type.INT, defaultValue: 0},
    noteCenter: {type: Type.INT, defaultValue: 60},
    noteWidth: {type: Type.INT, defaultValue: 0},
    // noteBias: {type: Type.FLOAT, defaultValue: 0},
    // noteSpread: {type: Type.INT, defaultValue: 0},
    pitchBias: {type: Type.FLOAT, defaultValue: 0},
    durationCenter: {type: Type.INT, defaultValue: 500},
    durationWidth: {type: Type.INT, defaultValue: 0},
    channel: {type: Type.INT, defaultValue: 0},
    numberNotes: {type: Type.INT, defaultValue: 1},
    intervalCenter: {type: Type.INT, defaultValue: 500},
    intervalWidth: {type: Type.INT, defaultValue: 0},
    velocityDecay: {type: Type.FLOAT, defaultValue: 0},
    preserveCenterFirst: {type: Type.BOOL, defaultValue: 0}
  },
  outputs: {
    noteOut: {type: Type.OBJECT, defaultValue: {}}
  },
  initFn: function (ports, state) {
    state.queue = [];
  },
  procfn: function (ports, state, id, triggerPort) {
    if  (triggerPort.name === "trigger" && triggerPort.get()) {
      var channel = MathUtil.clip(ports.channel.get(), 0, 15) >>> 0;
      var noteCenter = ports.noteCenter.get();
      var noteWidth = ports.noteWidth.get();
      var velocity = randMIDIRange(ports.velocityCenter.get(), ports.velocityWidth.get());
      var durationCenter = ports.durationCenter.get();
      var durationWidth = ports.durationWidth.get();
      var numNotes = Math.floor(Math.max(1, ports.numberNotes.get()));
      
      if (ports.preserveCenterFirst.get()) {
        ports.noteOut.set(new MIDINote(channel, noteCenter, velocity, durationCenter));
      }
      else {
        ports.noteOut.set(new MIDINote(channel, randMIDIRange(noteCenter, noteWidth), velocity, randTimeRange(durationCenter, durationWidth)));
      }
      
      if (numNotes > 1) {
        var note;
        var intervalCenter = ports.intervalCenter.get();
        var intervalWidth = ports.intervalWidth.get();
        var decay = (1 - ports.velocityDecay.get());
        var bias = ports.pitchBias.get();
        var now = process.hrtime();
        now = now[0] * 1000 + now[1] / 1000000;
        for (var i = 1; i < numNotes; i++) {
          // update note params and compute interval
          note = new MIDINote(channel, randMIDIRange(noteCenter += bias, noteWidth), velocity *= decay, randTimeRange(durationCenter, durationWidth));
          note.start = now + randTimeRange(intervalCenter * i, intervalWidth);
          state.queue.push(note);
        }
        state.queue.sort(noteStartComparator);
      }
    }
  },
  tick: function (ports, state, id, tickData) {
    var queue = state.queue;
    while (queue.length > 0 && queue[0].start < tickData.currentTick) {
      ports.noteOut.set(queue.shift());
    }
  }
};

exports.MIDIArrayTrigger = {
  nodetype: "MIDIArrayTrigger",
  descr: "Generates a triggered random note from a list of notes of varying width, velocity, and centers for all those parameters.",
  path: __filename,
  inputs: {
    trigger: {type: Type.ANY, defaultValue: 0, continuous: true},
    velocityCenter: {type: Type.INT, defaultValue: 100},
    velocityWidth: {type: Type.INT, defaultValue: 0},
    noteIntervalList: {type: Type.ARRAY, defaultValue: [60]},
    // noteRange: {type: Type.FLOAT, defaultValue: 0},
    noteListWidth: {type: Type.ZEROTOONE, defaultValue: 0},
    noteWidth: {type: Type.INT, defaultValue: 0},
    noteCenter: {type: Type.INT, defaultValue: 60},
    octaveWidth: {type: Type.INT, defaultValue: 0},
    // noteBias: {type: Type.FLOAT, defaultValue: 0},
    // noteSpread: {type: Type.INT, defaultValue: 0},
    noteWidthProb: {type: Type.FLOAT, defaultValue: 0},
    durationCenter: {type: Type.INT, defaultValue: 500},
    durationWidth: {type: Type.INT, defaultValue: 0},
    channel: {type: Type.INT, defaultValue: 0},
    numberNotes: {type: Type.INT, defaultValue: 1},
    intervalCenter: {type: Type.INT, defaultValue: 500},
    intervalWidth: {type: Type.INT, defaultValue: 0},
    velocityDecay: {type: Type.FLOAT, defaultValue: 0},
    preserveCenterFirst: {type: Type.BOOL, defaultValue: 0}
  },
  outputs: {
    noteOut: {type: Type.OBJECT, defaultValue: {}}
  },
  initFn: function (ports, state) {
    state.queue = [];
  },
  procfn: function (ports, state, id, triggerPort) {
    if  (triggerPort.name === "trigger" && triggerPort.get()) {
      var channel = MathUtil.clip(ports.channel.get(), 0, 15) >>> 0;
      var noteCenter = ports.noteCenter.get();
      var noteList = ports.noteIntervalList.get();
      var noteWidth = ports.noteWidth.get();
      var noteWidthProb = ports.noteWidthProb.get();
      var velocity = randMIDIRange(ports.velocityCenter.get(), ports.velocityWidth.get());
      var durationCenter = ports.durationCenter.get();
      var durationWidth = ports.durationWidth.get();
      var numNotes = Math.floor(Math.max(1, ports.numberNotes.get()));
      var listWidth = ports.noteListWidth.get();
      
      if (ports.preserveCenterFirst.get()) {
        ports.noteOut.set(new MIDINote(channel, noteList[0] + noteCenter, velocity, durationCenter));
      }
      else {
        // ports.noteOut.set(new MIDINote(channel, randMIDIRange(MathUtil.oneOf(noteList) + noteCenter, noteWidth), velocity, randTimeRange(durationCenter, durationWidth)));
        ports.noteOut.set(new MIDINote(channel, randMIDIRange(noteList[~~(Math.random() * listWidth * noteList.length)] + noteCenter, (Math.random() < noteWidthProb ? noteWidth : 0)), velocity, randTimeRange(durationCenter, durationWidth)));
      }
      
      if (numNotes > 1) {
        var note;
        var intervalCenter = ports.intervalCenter.get();
        var intervalWidth = ports.intervalWidth.get();
        var decay = (1 - ports.velocityDecay.get());
        var now = process.hrtime();
        var octaveRange = ports.octaveWidth.get();
        var octave = 0;
        now = now[0] * 1000 + now[1] / 1000000;
        for (var i = 1; i < numNotes; i++) {
          // update note params and compute interval
          octave = MathUtil.randInt(-octaveRange, octaveRange);
          // note = new MIDINote(channel, randMIDIRange(MathUtil.oneOf(noteList) + noteCenter + (octave * 12), noteWidth), velocity *= decay, randTimeRange(durationCenter, durationWidth));
          note = new MIDINote(channel, randMIDIRange(noteList[~~(Math.random() * listWidth * noteList.length)] + noteCenter + (octave * 12), (Math.random() < noteWidthProb ? noteWidth : 0)), velocity *= decay, randTimeRange(durationCenter, durationWidth));
          note.start = now + randTimeRange(intervalCenter * i, intervalWidth);
          state.queue.push(note);
        }
        state.queue.sort(noteStartComparator);
      }
    }
  },
  tick: function (ports, state, id, tickData) {
    var queue = state.queue;
    while (queue.length > 0 && queue[0].start < tickData.currentTick) {
      ports.noteOut.set(queue.shift());
    }
  }
};

exports.MIDISingleNote = {
  nodetype: "MIDINote",
  descr: "Generates a note with the given parameters that is sustained for as long as it is triggered.",
  path: __filename,
  inputs: {
    trigger: {type: Type.ANY, defaultValue: 0, continuous: true},
    velocity: {type: Type.INT, defaultValue: 100},
    note: {type: Type.INT, defaultValue: 60},
    channel: {type: Type.INT, defaultValue: 0}
  },
  outputs: {
    noteOut: {type: Type.OBJECT, defaultValue: {}}
  },
  initFn: function (ports, state) {
    state.note = null;
    state.channel = 0;
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort.name === "trigger") {
      // var trigger = !!+triggerPort.get(); // Yes, this is weird, I know.
      var trigger = triggerPort.get() > 0.5;
      if (trigger && state.note === null) {
        // start a note
        var channel = MathUtil.clip(ports.channel.get(), 0, 15) >>> 0;
        var note = ports.note.get();
        var velocity = ports.velocity.get();
        state.note = note;
        state.channel = channel;
        ports.noteOut.set(new MIDINote(channel, note, velocity, 0));
      }
      else if (!trigger && state.note !== null) {
        // stop the note
        ports.noteOut.set(new MIDINote(state.channel, state.note, 0, 0));
        state.note = null;
      }
    } 
  }
};
  
function noteStartComparator(a, b) {
  return (a.start - b.start) || 0;
}

function randMIDIRange(center, width) {
  return MathUtil.clip(center + (Math.random() * 2 - 1) * width, 0, 127);
}

function randTimeRange(center, width) {
  return Math.max(0, center + (Math.random() * 2 - 1) * width);
}
